from django.conf import settings
from django.db import models

from apps.organizations.models import Organization
from common.constants import INGESTION_STATUSES, SOURCE_TYPES


class DataSource(models.Model):
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name="data_sources")
    source_type = models.CharField(max_length=20, choices=SOURCE_TYPES)
    upload_method = models.CharField(max_length=50)
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="uploaded_data_sources",
    )
    uploaded_at = models.DateTimeField(auto_now_add=True)
    original_file_name = models.CharField(max_length=255)
    ingestion_status = models.CharField(max_length=20, choices=INGESTION_STATUSES, default="pending")

    class Meta:
        ordering = ["-uploaded_at"]
        indexes = [
            models.Index(fields=["organization", "source_type"]),
            models.Index(fields=["ingestion_status", "uploaded_at"]),
        ]

    def __str__(self) -> str:
        return f"{self.organization.name} - {self.source_type} - {self.original_file_name}"


class RawRecord(models.Model):
    data_source = models.ForeignKey(DataSource, on_delete=models.CASCADE, related_name="raw_records")
    row_number = models.PositiveIntegerField()
    raw_payload = models.JSONField()
    ingestion_timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["id"]
        unique_together = ("data_source", "row_number")
        indexes = [
            models.Index(fields=["data_source", "row_number"]),
        ]

    def __str__(self) -> str:
        return f"{self.data_source_id}:{self.row_number}"
