from django.db import migrations


def noop(apps, schema_editor):
    """Historical migration kept for compatibility; demo seeding removed."""
    return


class Migration(migrations.Migration):
    dependencies = [
        ("organizations", "0001_initial"),
    ]

    operations = [migrations.RunPython(noop, reverse_code=noop)]
