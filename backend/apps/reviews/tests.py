from django.test import TestCase
from rest_framework.test import APIClient

from apps.ingestion.models import DataSource
from apps.normalization.models import NormalizedEmissionRecord


class RegistrationFlowTests(TestCase):
    def test_registration_creates_a_demo_ready_workspace(self):
        response = APIClient().post(
            "/api/auth/register/",
            {
                "organization_name": "Render Test Organization",
                "username": "render_test_user",
                "email": "render-test@example.com",
                "password": "DeploymentTest!482",
                "confirm_password": "DeploymentTest!482",
            },
            format="json",
            secure=True,
        )

        self.assertEqual(response.status_code, 201)
        organization_id = response.json()["data"]["user"]["organization"]
        self.assertEqual(
            DataSource.objects.filter(organization_id=organization_id).count(),
            3,
        )
        self.assertGreater(
            NormalizedEmissionRecord.objects.filter(
                organization_id=organization_id
            ).count(),
            0,
        )


class HealthCheckTests(TestCase):
    def test_health_endpoint_does_not_require_authentication(self):
        response = APIClient().get("/health/", secure=True)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "ok")
