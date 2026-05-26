import json
from pathlib import Path

from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand, CommandError

from apps.ingestion.services import ingest_csv_source, ingest_travel_payload
from apps.organizations.models import Organization
from common.constants import SOURCE_TYPE_SAP, SOURCE_TYPE_UTILITY


class Command(BaseCommand):
    help = "Load Verdantrix sample SAP, utility, and travel records into the local environment."

    def add_arguments(self, parser):
        parser.add_argument(
            "--as-username",
            dest="as_username",
            default=None,
            help="Optional: attribute sample uploads to an existing username.",
        )

    def handle(self, *args, **options):
        root_dir = Path(__file__).resolve().parents[5]
        sample_dir = root_dir / "sample-data"
        organization = Organization.objects.first()
        if not organization:
            organization = Organization.objects.create(
                name="Verdantrix Industrial Group",
                industry="Specialty Chemicals",
                country="Germany",
            )

        uploaded_by = None
        as_username = options.get("as_username")
        if as_username:
            from django.contrib.auth import get_user_model

            uploaded_by = get_user_model().objects.filter(username=as_username).first()
            if not uploaded_by:
                raise CommandError(f"No user found with username '{as_username}'.")
        else:
            try:
                from django.contrib.auth import get_user_model

                uploaded_by = get_user_model().objects.filter(organization=organization).order_by("id").first()
            except Exception:
                uploaded_by = None

        for file_name, source_type in [
            ("sap_fuel_export.csv", SOURCE_TYPE_SAP),
            ("utility_billing_export.csv", SOURCE_TYPE_UTILITY),
        ]:
            csv_bytes = (sample_dir / file_name).read_bytes()
            content = ContentFile(csv_bytes, name=file_name)
            ingest_csv_source(
                organization_id=organization.id,
                source_type=source_type,
                uploaded_by=uploaded_by,
                file=content,
                upload_method="sample_seed",
            )

        travel_records = json.loads((sample_dir / "travel_sync_response.json").read_text(encoding="utf-8"))
        ingest_travel_payload(
            organization_id=organization.id,
            uploaded_by=uploaded_by,
            records=travel_records,
        )

        self.stdout.write(self.style.SUCCESS("Verdantrix sample datasets loaded successfully."))
