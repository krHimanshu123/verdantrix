from rest_framework import mixins, viewsets
from rest_framework.permissions import IsAuthenticated

from common.utils import user_organization_id
from .models import AuditLog
from .serializers import AuditLogSerializer


class AuditLogViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = AuditLogSerializer
    filterset_fields = ["emission_record", "action_type"]
    ordering_fields = ["timestamp"]

    def get_queryset(self):
        queryset = AuditLog.objects.select_related("changed_by", "emission_record")
        current_organization_id = user_organization_id(self.request.user)
        if current_organization_id:
            queryset = queryset.filter(emission_record__organization_id=current_organization_id)
        record_id = self.request.query_params.get("record_id")
        if record_id:
            queryset = queryset.filter(emission_record_id=record_id)
        return queryset
