from __future__ import annotations

import csv
import io
from dataclasses import dataclass
from decimal import Decimal
from typing import Callable

from django.contrib.auth import get_user_model
from django.db import transaction

from apps.audit.services import create_audit_log
from apps.ingestion.models import DataSource, RawRecord
from apps.normalization.models import NormalizedEmissionRecord
from apps.normalization.services import normalize_sap_row, normalize_travel_row, normalize_utility_row
from apps.normalization.validation import evaluate_record
from apps.organizations.models import Organization
from common.constants import (
    AUDIT_ACTION_INGESTED,
    INGESTION_STATUS_COMPLETED,
    INGESTION_STATUS_FAILED,
    INGESTION_STATUS_PROCESSING,
    SOURCE_TYPE_SAP,
    SOURCE_TYPE_TRAVEL,
    SOURCE_TYPE_UTILITY,
)

User = get_user_model()


@dataclass
class IngestionResult:
    data_source: DataSource
    processed_rows: int
    created_records: int
    flagged_records: int
    rejected_records: int


Normalizer = Callable[[dict, Organization, RawRecord], dict]


SOURCE_NORMALIZERS: dict[str, Normalizer] = {
    SOURCE_TYPE_SAP: normalize_sap_row,
    SOURCE_TYPE_UTILITY: normalize_utility_row,
    SOURCE_TYPE_TRAVEL: normalize_travel_row,
}


def _decode_file(file) -> str:
    return file.read().decode("utf-8-sig")


def _upsert_normalized_record(payload: dict) -> NormalizedEmissionRecord:
    record = NormalizedEmissionRecord.objects.create(**payload)
    evaluation = evaluate_record(record)
    record.validation_status = evaluation["validation_status"]
    record.anomaly_score = evaluation["anomaly_score"]
    if evaluation["default_note"]:
        record.analyst_notes = evaluation["default_note"]
    record.save(update_fields=["validation_status", "anomaly_score", "analyst_notes", "updated_at"])
    create_audit_log(
        record,
        action_type=AUDIT_ACTION_INGESTED,
        old_value=None,
        new_value={
            "validation_status": record.validation_status,
            "anomaly_score": str(record.anomaly_score),
            "source_reference": record.source_reference,
        },
        changed_by=record.raw_record.data_source.uploaded_by,
    )
    return record


@transaction.atomic
def ingest_csv_source(*, organization_id: int, source_type: str, uploaded_by, file, upload_method: str) -> IngestionResult:
    organization = Organization.objects.get(pk=organization_id)
    data_source = DataSource.objects.create(
        organization=organization,
        source_type=source_type,
        upload_method=upload_method,
        uploaded_by=uploaded_by,
        original_file_name=file.name,
        ingestion_status=INGESTION_STATUS_PROCESSING,
    )

    processed_rows = 0
    created_records = 0
    flagged_records = 0
    rejected_records = 0

    try:
        csv_buffer = io.StringIO(_decode_file(file))
        reader = csv.DictReader(csv_buffer)
        normalizer = SOURCE_NORMALIZERS[source_type]
        for row_number, row in enumerate(reader, start=1):
            processed_rows += 1
            raw_record = RawRecord.objects.create(
                data_source=data_source,
                row_number=row_number,
                raw_payload=row,
            )
            normalized_payload = normalizer(row, organization, raw_record)
            record = _upsert_normalized_record(normalized_payload)
            created_records += 1
            if record.validation_status == "flagged":
                flagged_records += 1
            if record.validation_status == "rejected":
                rejected_records += 1

        data_source.ingestion_status = INGESTION_STATUS_COMPLETED
        data_source.save(update_fields=["ingestion_status"])
    except Exception:
        data_source.ingestion_status = INGESTION_STATUS_FAILED
        data_source.save(update_fields=["ingestion_status"])
        raise

    return IngestionResult(
        data_source=data_source,
        processed_rows=processed_rows,
        created_records=created_records,
        flagged_records=flagged_records,
        rejected_records=rejected_records,
    )


@transaction.atomic
def ingest_travel_payload(*, organization_id: int, uploaded_by, records: list[dict]) -> IngestionResult:
    organization = Organization.objects.get(pk=organization_id)
    data_source = DataSource.objects.create(
        organization=organization,
        source_type=SOURCE_TYPE_TRAVEL,
        upload_method="api_sync",
        uploaded_by=uploaded_by,
        original_file_name="travel_sync_response.json",
        ingestion_status=INGESTION_STATUS_PROCESSING,
    )
    processed_rows = 0
    created_records = 0
    flagged_records = 0
    rejected_records = 0

    try:
        for row_number, row in enumerate(records, start=1):
            processed_rows += 1
            raw_record = RawRecord.objects.create(
                data_source=data_source,
                row_number=row_number,
                raw_payload=row,
            )
            normalized_payload = normalize_travel_row(row, organization, raw_record)
            record = _upsert_normalized_record(normalized_payload)
            created_records += 1
            if record.validation_status == "flagged":
                flagged_records += 1
            if record.validation_status == "rejected":
                rejected_records += 1

        data_source.ingestion_status = INGESTION_STATUS_COMPLETED
        data_source.save(update_fields=["ingestion_status"])
    except Exception:
        data_source.ingestion_status = INGESTION_STATUS_FAILED
        data_source.save(update_fields=["ingestion_status"])
        raise

    return IngestionResult(
        data_source=data_source,
        processed_rows=processed_rows,
        created_records=created_records,
        flagged_records=flagged_records,
        rejected_records=rejected_records,
    )
