from django.db import models

from apps.ingestion.models import RawRecord
from apps.organizations.models import Organization
from common.constants import ANALYST_STATUSES, VALIDATION_STATUSES


class NormalizedEmissionRecord(models.Model):
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name="emission_records")
    raw_record = models.OneToOneField(RawRecord, on_delete=models.CASCADE, related_name="normalized_record")
    scope_category = models.CharField(max_length=50)
    emission_category = models.CharField(max_length=120)
    activity_type = models.CharField(max_length=120)
    source_reference = models.CharField(max_length=255)
    quantity = models.DecimalField(max_digits=18, decimal_places=4)
    original_unit = models.CharField(max_length=40, blank=True)
    normalized_unit = models.CharField(max_length=40, blank=True)
    normalized_quantity = models.DecimalField(max_digits=18, decimal_places=4, default=0)
    emission_factor = models.DecimalField(max_digits=18, decimal_places=6, default=0)
    estimated_co2e = models.DecimalField(max_digits=18, decimal_places=6, default=0)
    reporting_period_start = models.DateField(null=True, blank=True)
    reporting_period_end = models.DateField(null=True, blank=True)
    validation_status = models.CharField(max_length=20, choices=VALIDATION_STATUSES, default="valid")
    analyst_status = models.CharField(max_length=20, choices=ANALYST_STATUSES, default="pending")
    anomaly_score = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    analyst_notes = models.TextField(blank=True)
    locked_for_audit = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]
        indexes = [
            models.Index(fields=["validation_status", "analyst_status"]),
            models.Index(fields=["source_reference"]),
        ]

    def __str__(self) -> str:
        return f"{self.organization.name} - {self.activity_type} - {self.id}"
