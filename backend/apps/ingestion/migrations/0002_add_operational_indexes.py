from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("ingestion", "0001_initial"),
    ]

    operations = [
        migrations.AddIndex(
            model_name="datasource",
            index=models.Index(fields=["organization", "source_type"], name="ingestion_d_organiz_403631_idx"),
        ),
        migrations.AddIndex(
            model_name="datasource",
            index=models.Index(fields=["ingestion_status", "uploaded_at"], name="ingestion_d_ingesti_a29748_idx"),
        ),
        migrations.AddIndex(
            model_name="rawrecord",
            index=models.Index(fields=["data_source", "row_number"], name="ingestion_r_data_so_dfd14d_idx"),
        ),
    ]
