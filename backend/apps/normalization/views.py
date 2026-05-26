from rest_framework import mixins, status, viewsets
from rest_framework.permissions import IsAuthenticated

from apps.audit.services import create_audit_log
from common.constants import AUDIT_ACTION_PARTIAL_UPDATE
from common.responses import success_response
from common.utils import user_organization_id
from .models import NormalizedEmissionRecord
from .serializers import NormalizedEmissionRecordSerializer


class NormalizedEmissionRecordViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet,
):
    permission_classes = [IsAuthenticated]
    serializer_class = NormalizedEmissionRecordSerializer
    filterset_fields = [
        "organization",
        "validation_status",
        "analyst_status",
        "activity_type",
        "locked_for_audit",
    ]
    ordering_fields = ["updated_at", "estimated_co2e", "anomaly_score", "reporting_period_end"]
    search_fields = ["source_reference", "activity_type", "raw_record__data_source__original_file_name"]

    def get_queryset(self):
        queryset = (
            NormalizedEmissionRecord.objects.select_related(
                "organization",
                "raw_record",
                "raw_record__data_source",
            )
            .prefetch_related("audit_logs")
        )
        current_organization_id = user_organization_id(self.request.user)
        if current_organization_id:
            queryset = queryset.filter(organization_id=current_organization_id)
        source_type = self.request.query_params.get("source_type")
        if source_type:
            queryset = queryset.filter(raw_record__data_source__source_type=source_type)
        return queryset

    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()
        old_value = {
            "analyst_status": instance.analyst_status,
            "analyst_notes": instance.analyst_notes,
            "locked_for_audit": instance.locked_for_audit,
        }
        response = super().partial_update(request, *args, **kwargs)
        instance.refresh_from_db()
        create_audit_log(
            instance,
            action_type=AUDIT_ACTION_PARTIAL_UPDATE,
            old_value=old_value,
            new_value={
                "analyst_status": instance.analyst_status,
                "analyst_notes": instance.analyst_notes,
                "locked_for_audit": instance.locked_for_audit,
            },
            changed_by=request.user,
        )
        return success_response(response.data, message="Verdantrix record updated successfully.", status_code=status.HTTP_200_OK)
