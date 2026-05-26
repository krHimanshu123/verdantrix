from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("organizations", "0002_seed_demo_organization"),
    ]

    operations = [
        migrations.AddIndex(
            model_name="organization",
            index=models.Index(fields=["name"], name="organizatio_name_7b06eb_idx"),
        ),
    ]
