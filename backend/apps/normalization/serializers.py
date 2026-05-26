from rest_framework import serializers

from .models import NormalizedEmissionRecord


class NormalizedEmissionRecordSerializer(serializers.ModelSerializer):
    organization_name = serializers.CharField(source="organization.name", read_only=True)
    source_type = serializers.CharField(source="raw_record.data_source.source_type", read_only=True)
    source_file_name = serializers.CharField(source="raw_record.data_source.original_file_name", read_only=True)
    raw_payload = serializers.JSONField(source="raw_record.raw_payload", read_only=True)
    audit_count = serializers.IntegerField(source="audit_logs.count", read_only=True)

    class Meta:
        model = NormalizedEmissionRecord
        fields = [
            "id",
            "organization",
            "organization_name",
            "raw_record",
            "raw_payload",
            "source_type",
            "source_file_name",
            "scope_category",
            "emission_category",
            "activity_type",
            "source_reference",
            "quantity",
            "original_unit",
            "normalized_unit",
            "normalized_quantity",
            "emission_factor",
            "estimated_co2e",
            "reporting_period_start",
            "reporting_period_end",
            "validation_status",
            "analyst_status",
            "anomaly_score",
            "analyst_notes",
            "locked_for_audit",
            "created_at",
            "updated_at",
            "audit_count",
        ]
        read_only_fields = [
            "organization",
            "raw_record",
            "scope_category",
            "emission_category",
            "activity_type",
            "source_reference",
            "quantity",
            "original_unit",
            "normalized_unit",
            "normalized_quantity",
            "emission_factor",
            "estimated_co2e",
            "reporting_period_start",
            "reporting_period_end",
            "validation_status",
            "anomaly_score",
            "locked_for_audit",
            "created_at",
            "updated_at",
        ]

    def validate(self, attrs):
        instance = self.instance
        if instance and instance.locked_for_audit:
            raise serializers.ValidationError("Locked Verdantrix records cannot be modified.")
        return attrs
