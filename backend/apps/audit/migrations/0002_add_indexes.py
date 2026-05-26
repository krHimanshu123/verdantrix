from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("audit", "0001_initial"),
    ]

    operations = [
        migrations.AddIndex(
            model_name="auditlog",
            index=models.Index(fields=["action_type", "timestamp"], name="audit_aud_action__3d756c_idx"),
        ),
        migrations.AddIndex(
            model_name="auditlog",
            index=models.Index(fields=["emission_record", "timestamp"], name="audit_aud_emissio_9cd0c2_idx"),
        ),
    ]
