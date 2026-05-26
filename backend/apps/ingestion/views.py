import json
from pathlib import Path

from django.db.models import Count
from rest_framework import mixins, status, viewsets
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from apps.ingestion.models import DataSource
from apps.ingestion.serializers import DataSourceSerializer, UploadRequestSerializer
from apps.ingestion.services import ingest_csv_source, ingest_travel_payload
from common.constants import SOURCE_TYPE_SAP, SOURCE_TYPE_UTILITY
from common.responses import error_response, success_response
from common.utils import user_organization_id


class DataSourceViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = DataSourceSerializer

    def get_queryset(self):
        queryset = DataSource.objects.select_related("organization", "uploaded_by").annotate(raw_record_count=Count("raw_records"))
        current_organization_id = user_organization_id(self.request.user)
        if current_organization_id:
            queryset = queryset.filter(organization_id=current_organization_id)
        org_id = self.request.query_params.get("organization")
        source_type = self.request.query_params.get("source_type")
        if org_id:
            queryset = queryset.filter(organization_id=org_id)
        if source_type:
            queryset = queryset.filter(source_type=source_type)
        return queryset


class BaseUploadView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    source_type = None
    success_message = ""

    def _validated_organization_id(self, organization_id: int, request) -> int:
        current_organization_id = user_organization_id(request.user)
        if current_organization_id and current_organization_id != organization_id:
            raise PermissionError("You do not have access to upload data for this organization.")
        return organization_id

    def post(self, request):
        serializer = UploadRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            organization_id = self._validated_organization_id(serializer.validated_data["organization_id"], request)
        except PermissionError as exc:
            return error_response(str(exc), status_code=status.HTTP_403_FORBIDDEN)
        result = ingest_csv_source(
            organization_id=organization_id,
            source_type=self.source_type,
            uploaded_by=request.user,
            file=serializer.validated_data["file"],
            upload_method="csv_upload",
        )
        return success_response(
            {
                "data_source_id": result.data_source.id,
                "processed_rows": result.processed_rows,
                "created_records": result.created_records,
                "flagged_records": result.flagged_records,
                "rejected_records": result.rejected_records,
            },
            message=self.success_message,
            status_code=status.HTTP_201_CREATED,
        )


class SAPUploadView(BaseUploadView):
    source_type = SOURCE_TYPE_SAP
    success_message = "SAP export ingested into Verdantrix successfully."


class UtilityUploadView(BaseUploadView):
    source_type = SOURCE_TYPE_UTILITY
    success_message = "Utility billing export ingested into Verdantrix successfully."


class TravelSyncView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        organization_id = request.data.get("organization_id")
        if not organization_id:
            return error_response("organization_id is required for Verdantrix travel sync.")
        current_organization_id = user_organization_id(request.user)
        if current_organization_id and current_organization_id != int(organization_id):
            return error_response("You do not have access to sync travel data for this organization.", status_code=status.HTTP_403_FORBIDDEN)

        records = request.data.get("records")
        if not records:
            sample_path = Path(__file__).resolve().parents[3] / "sample-data" / "travel_sync_response.json"
            with open(sample_path, "r", encoding="utf-8") as sample_file:
                records = json.load(sample_file)

        result = ingest_travel_payload(
            organization_id=int(organization_id),
            uploaded_by=request.user,
            records=records,
        )
        return success_response(
            {
                "data_source_id": result.data_source.id,
                "processed_rows": result.processed_rows,
                "created_records": result.created_records,
                "flagged_records": result.flagged_records,
                "rejected_records": result.rejected_records,
            },
            message="Travel platform records synchronized into Verdantrix successfully.",
            status_code=status.HTTP_201_CREATED,
        )
