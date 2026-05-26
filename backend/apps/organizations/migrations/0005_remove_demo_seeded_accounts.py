from django.db import migrations


def remove_demo_seed(apps, schema_editor):
    Organization = apps.get_model("organizations", "Organization")
    User = apps.get_model("users", "User")

    org_qs = Organization.objects.filter(name="Verdantrix Industrial Group")
    if org_qs.exists():
        User.objects.filter(
            organization__in=org_qs,
            email__iendswith="@verdantrix.local",
        ).delete()
        org_qs.delete()


def noop(apps, schema_editor):
    return


class Migration(migrations.Migration):
    dependencies = [
        ("organizations", "0004_rename_organizatio_name_7b06eb_idx_organizatio_name_537540_idx"),
        ("users", "0002_alter_user_managers_and_more"),
    ]

    operations = [
        migrations.RunPython(remove_demo_seed, reverse_code=noop),
    ]
