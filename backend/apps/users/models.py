from django.contrib.auth.models import AbstractUser
from django.db import models

from apps.organizations.models import Organization


class User(AbstractUser):
    ROLE_ANALYST = "analyst"
    ROLE_MANAGER = "manager"

    ROLE_CHOICES = [
        (ROLE_ANALYST, "Analyst"),
        (ROLE_MANAGER, "Manager"),
    ]

    email = models.EmailField(unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default=ROLE_ANALYST)
    organization = models.ForeignKey(
        Organization,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="users",
    )

    class Meta:
        ordering = ["username"]
        indexes = [
            models.Index(fields=["organization", "role"]),
        ]

    def __str__(self) -> str:
        return self.username

