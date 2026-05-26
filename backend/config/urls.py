from django.contrib import admin
from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from apps.analytics.views import DashboardMetricsView
from apps.audit.views import AuditLogViewSet
from apps.ingestion.views import DataSourceViewSet, SAPUploadView, TravelSyncView, UtilityUploadView
from apps.normalization.views import NormalizedEmissionRecordViewSet
from apps.organizations.views import OrganizationViewSet
from apps.reviews.views import AuthLoginView, auth_me_view, register_view, review_action_view

router = DefaultRouter()
router.register(r"organizations", OrganizationViewSet, basename="organization")
router.register(r"data-sources", DataSourceViewSet, basename="data-source")
router.register(r"records", NormalizedEmissionRecordViewSet, basename="record")
router.register(r"audit-logs", AuditLogViewSet, basename="audit-log")

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/register/", register_view, name="auth-register"),
    path("api/auth/login/", AuthLoginView.as_view(), name="auth-login"),
    path("api/auth/refresh/", TokenRefreshView.as_view(), name="token-refresh"),
    path("api/auth/me/", auth_me_view, name="auth-me"),
    path("api/dashboard/metrics/", DashboardMetricsView.as_view(), name="dashboard-metrics"),
    path("api/ingestion/sap/upload/", SAPUploadView.as_view(), name="sap-upload"),
    path("api/ingestion/utility/upload/", UtilityUploadView.as_view(), name="utility-upload"),
    path("api/travel/sync/", TravelSyncView.as_view(), name="travel-sync"),
    path("api/reviews/<int:pk>/action/", review_action_view, name="review-action"),
    path("api/", include(router.urls)),
]
