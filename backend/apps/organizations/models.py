from django.db import models


class Organization(models.Model):
    name = models.CharField(max_length=255)
    industry = models.CharField(max_length=120)
    country = models.CharField(max_length=120)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]
        indexes = [
            models.Index(fields=["name"]),
        ]

    def __str__(self) -> str:
        return self.name
