from rest_framework import serializers

from .models import AuditLog


class AuditLogSerializer(serializers.ModelSerializer):
    changed_by_username = serializers.CharField(source="changed_by.username", read_only=True)
    emission_record_reference = serializers.CharField(source="emission_record.source_reference", read_only=True)

    class Meta:
        model = AuditLog
        fields = [
            "id",
            "emission_record",
            "emission_record_reference",
            "action_type",
            "old_value",
            "new_value",
            "changed_by",
            "changed_by_username",
            "timestamp",
        ]
