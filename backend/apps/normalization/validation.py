from __future__ import annotations

from decimal import Decimal

from django.db.models import Avg

from .models import NormalizedEmissionRecord
from common.utils import is_future_date


def evaluate_record(record: NormalizedEmissionRecord) -> dict:
    score = Decimal("0")
    status = "valid"
    notes = []

    if record.quantity < 0:
        status = "rejected"
        score += Decimal("95")
        notes.append("Negative quantity detected during Verdantrix validation.")

    if not record.original_unit:
        status = "flagged" if status != "rejected" else status
        score += Decimal("20")
        notes.append("Missing source unit detected.")

    if not record.reporting_period_start or not record.reporting_period_end:
        status = "flagged" if status != "rejected" else status
        score += Decimal("25")
        notes.append("Missing reporting period boundary.")

    if is_future_date(record.reporting_period_start) or is_future_date(record.reporting_period_end):
        status = "rejected"
        score += Decimal("85")
        notes.append("Future-dated activity detected.")

    duplicate_exists = NormalizedEmissionRecord.objects.filter(
        organization=record.organization,
        activity_type=record.activity_type,
        source_reference=record.source_reference,
        normalized_quantity=record.normalized_quantity,
        reporting_period_start=record.reporting_period_start,
        reporting_period_end=record.reporting_period_end,
    ).exclude(pk=record.pk).exists()
    if duplicate_exists:
        status = "flagged" if status != "rejected" else status
        score += Decimal("40")
        notes.append("Potential duplicate record detected.")

    baseline = (
        NormalizedEmissionRecord.objects.filter(
            organization=record.organization,
            activity_type=record.activity_type,
        )
        .exclude(pk=record.pk)
        .aggregate(avg_quantity=Avg("normalized_quantity"))
        .get("avg_quantity")
    )
    if baseline and baseline > 0 and record.normalized_quantity > Decimal(str(baseline)) * Decimal("3.5"):
        status = "flagged" if status != "rejected" else status
        score += Decimal("45")
        notes.append("Suspiciously high consumption versus historical baseline.")
    elif _exceeds_static_threshold(record):
        status = "flagged" if status != "rejected" else status
        score += Decimal("35")
        notes.append("Suspiciously high consumption against static thresholds.")

    score = min(score, Decimal("99.99"))
    return {"validation_status": status, "anomaly_score": score, "default_note": " ".join(notes).strip()}


def _exceeds_static_threshold(record: NormalizedEmissionRecord) -> bool:
    if record.emission_category == "purchased_electricity":
        return record.normalized_quantity > Decimal("200000")
    if record.emission_category == "business_travel":
        return record.normalized_quantity > Decimal("12000")
    return record.normalized_quantity > Decimal("50000")
