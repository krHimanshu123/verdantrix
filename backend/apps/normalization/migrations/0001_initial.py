import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        ("ingestion", "0001_initial"),
        ("organizations", "0002_seed_demo_organization"),
    ]

    operations = [
        migrations.CreateModel(
            name="NormalizedEmissionRecord",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("scope_category", models.CharField(max_length=50)),
                ("emission_category", models.CharField(max_length=120)),
                ("activity_type", models.CharField(max_length=120)),
                ("source_reference", models.CharField(max_length=255)),
                ("quantity", models.DecimalField(decimal_places=4, max_digits=18)),
                ("original_unit", models.CharField(blank=True, max_length=40)),
                ("normalized_unit", models.CharField(blank=True, max_length=40)),
                ("normalized_quantity", models.DecimalField(decimal_places=4, default=0, max_digits=18)),
                ("emission_factor", models.DecimalField(decimal_places=6, default=0, max_digits=18)),
                ("estimated_co2e", models.DecimalField(decimal_places=6, default=0, max_digits=18)),
                ("reporting_period_start", models.DateField(blank=True, null=True)),
                ("reporting_period_end", models.DateField(blank=True, null=True)),
                ("validation_status", models.CharField(choices=[("valid", "Valid"), ("flagged", "Flagged"), ("rejected", "Rejected")], default="valid", max_length=20)),
                ("analyst_status", models.CharField(choices=[("pending", "Pending"), ("approved", "Approved"), ("rejected", "Rejected"), ("locked", "Locked")], default="pending", max_length=20)),
                ("anomaly_score", models.DecimalField(decimal_places=2, default=0, max_digits=8)),
                ("analyst_notes", models.TextField(blank=True)),
                ("locked_for_audit", models.BooleanField(default=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("organization", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="emission_records", to="organizations.organization")),
                ("raw_record", models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name="normalized_record", to="ingestion.rawrecord")),
            ],
            options={
                "ordering": ["-updated_at"],
                "indexes": [
                    models.Index(fields=["validation_status", "analyst_status"], name="normalizati_validat_8fe8cf_idx"),
                    models.Index(fields=["source_reference"], name="normalizati_source__c6b2be_idx"),
                ],
            },
        )
    ]
