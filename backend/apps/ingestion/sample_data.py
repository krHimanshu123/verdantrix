import json
from pathlib import Path

from django.core.files.base import ContentFile

from apps.ingestion.models import DataSource
from apps.ingestion.services import ingest_csv_source, ingest_travel_payload
from common.constants import SOURCE_TYPE_SAP, SOURCE_TYPE_UTILITY


def load_sample_data_for_organization(*, organization, uploaded_by=None) -> bool:
    """Load the bundled demo datasets once for an organization."""
    if DataSource.objects.filter(organization=organization).exists():
        return False

    sample_dir = Path(__file__).resolve().parents[3] / "sample-data"

    for file_name, source_type in [
        ("sap_fuel_export.csv", SOURCE_TYPE_SAP),
        ("utility_billing_export.csv", SOURCE_TYPE_UTILITY),
    ]:
        content = ContentFile((sample_dir / file_name).read_bytes(), name=file_name)
        ingest_csv_source(
            organization_id=organization.id,
            source_type=source_type,
            uploaded_by=uploaded_by,
            file=content,
            upload_method="sample_seed",
        )

    travel_records = json.loads(
        (sample_dir / "travel_sync_response.json").read_text(encoding="utf-8")
    )
    ingest_travel_payload(
        organization_id=organization.id,
        uploaded_by=uploaded_by,
        records=travel_records,
    )
    return True
