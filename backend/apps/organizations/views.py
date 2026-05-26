from rest_framework import mixins, viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated

from common.utils import user_organization_id
from .models import Organization
from .serializers import OrganizationSerializer


class OrganizationViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    serializer_class = OrganizationSerializer

    def get_permissions(self):
        if self.action in {"list", "retrieve"}:
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_queryset(self):
        queryset = Organization.objects.all()
        current_organization_id = user_organization_id(self.request.user) if self.request.user.is_authenticated else None
        if current_organization_id:
            queryset = queryset.filter(id=current_organization_id)
        return queryset
