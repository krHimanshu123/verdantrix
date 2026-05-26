import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("organizations", "0002_seed_demo_organization"),
    ]

    operations = [
        migrations.CreateModel(
            name="DataSource",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("source_type", models.CharField(choices=[("sap", "SAP"), ("utility", "Utility"), ("travel", "Travel")], max_length=20)),
                ("upload_method", models.CharField(max_length=50)),
                ("uploaded_at", models.DateTimeField(auto_now_add=True)),
                ("original_file_name", models.CharField(max_length=255)),
                ("ingestion_status", models.CharField(choices=[("pending", "Pending"), ("processing", "Processing"), ("completed", "Completed"), ("failed", "Failed")], default="pending", max_length=20)),
                ("organization", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="data_sources", to="organizations.organization")),
                ("uploaded_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="uploaded_data_sources", to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering": ["-uploaded_at"]},
        ),
        migrations.CreateModel(
            name="RawRecord",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("row_number", models.PositiveIntegerField()),
                ("raw_payload", models.JSONField()),
                ("ingestion_timestamp", models.DateTimeField(auto_now_add=True)),
                ("data_source", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="raw_records", to="ingestion.datasource")),
            ],
            options={"ordering": ["id"], "unique_together": {("data_source", "row_number")}},
        ),
    ]
