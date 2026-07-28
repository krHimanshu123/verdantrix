from django.core.management.base import BaseCommand, CommandError

from apps.ingestion.sample_data import load_sample_data_for_organization
from apps.organizations.models import Organization


class Command(BaseCommand):
    help = "Load Verdantrix sample SAP, utility, and travel records into the local environment."

    def add_arguments(self, parser):
        parser.add_argument(
            "--as-username",
            dest="as_username",
            default=None,
            help="Optional: attribute sample uploads to an existing username.",
        )

    def handle(self, *args, **options):
        organization = Organization.objects.first()
        if not organization:
            organization = Organization.objects.create(
                name="Verdantrix Industrial Group",
                industry="Specialty Chemicals",
                country="Germany",
            )

        uploaded_by = None
        as_username = options.get("as_username")
        if as_username:
            from django.contrib.auth import get_user_model

            uploaded_by = get_user_model().objects.filter(username=as_username).first()
            if not uploaded_by:
                raise CommandError(f"No user found with username '{as_username}'.")
        else:
            try:
                from django.contrib.auth import get_user_model

                uploaded_by = get_user_model().objects.filter(organization=organization).order_by("id").first()
            except Exception:
                uploaded_by = None

        loaded = load_sample_data_for_organization(
            organization=organization,
            uploaded_by=uploaded_by,
        )
        if loaded:
            self.stdout.write(self.style.SUCCESS("Verdantrix sample datasets loaded successfully."))
        else:
            self.stdout.write(self.style.WARNING("Sample data already exists; nothing was added."))
