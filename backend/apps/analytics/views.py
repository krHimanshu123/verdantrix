from django.db.models import Count
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from apps.ingestion.models import DataSource
from apps.normalization.models import NormalizedEmissionRecord
from common.utils import user_organization_id
from common.responses import success_response


class DashboardMetricsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        organization_id = user_organization_id(request.user)
        records = NormalizedEmissionRecord.objects.all()
        data_sources = DataSource.objects.all()
        if organization_id:
            records = records.filter(organization_id=organization_id)
            data_sources = data_sources.filter(organization_id=organization_id)

        breakdown = (
            data_sources.values("source_type")
            .annotate(total=Count("id"))
            .order_by("source_type")
        )
        anomaly_bands = {
            "low": records.filter(anomaly_score__lt=20).count(),
            "medium": records.filter(anomaly_score__gte=20, anomaly_score__lt=60).count(),
            "high": records.filter(anomaly_score__gte=60).count(),
        }
        validation_breakdown = (
            records.values("validation_status")
            .annotate(total=Count("id"))
            .order_by("validation_status")
        )
        return success_response(
            {
                "total_ingested_rows": data_sources.aggregate(total=Count("raw_records"))["total"] or 0,
                "flagged_rows": records.filter(validation_status="flagged").count(),
                "approved_rows": records.filter(analyst_status="approved").count(),
                "locked_rows": records.filter(locked_for_audit=True).count(),
                "source_breakdown": list(breakdown),
                "anomaly_statistics": anomaly_bands,
                "validation_breakdown": list(validation_breakdown),
            }
        )
