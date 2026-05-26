from rest_framework import serializers

from .models import DataSource, RawRecord


class RawRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = RawRecord
        fields = ["id", "row_number", "raw_payload", "ingestion_timestamp"]


class DataSourceSerializer(serializers.ModelSerializer):
    organization_name = serializers.CharField(source="organization.name", read_only=True)
    uploaded_by_username = serializers.CharField(source="uploaded_by.username", read_only=True)
    raw_record_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = DataSource
        fields = [
            "id",
            "organization",
            "organization_name",
            "source_type",
            "upload_method",
            "uploaded_by",
            "uploaded_by_username",
            "uploaded_at",
            "original_file_name",
            "ingestion_status",
            "raw_record_count",
        ]


class UploadRequestSerializer(serializers.Serializer):
    organization_id = serializers.IntegerField()
    file = serializers.FileField()
