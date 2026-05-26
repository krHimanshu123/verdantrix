from django.conf import settings
from django.db import models

from apps.normalization.models import NormalizedEmissionRecord


class AuditLog(models.Model):
    emission_record = models.ForeignKey(NormalizedEmissionRecord, on_delete=models.CASCADE, related_name="audit_logs")
    action_type = models.CharField(max_length=50)
    old_value = models.JSONField(null=True, blank=True)
    new_value = models.JSONField(null=True, blank=True)
    changed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="audit_logs",
    )
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-timestamp"]
        indexes = [
            models.Index(fields=["action_type", "timestamp"]),
            models.Index(fields=["emission_record", "timestamp"]),
        ]

    def __str__(self) -> str:
        return f"{self.action_type} on {self.emission_record_id}"
