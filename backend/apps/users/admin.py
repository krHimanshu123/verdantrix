from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin

from .models import User


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    fieldsets = DjangoUserAdmin.fieldsets + (
        ("Verdantrix", {"fields": ("role", "organization")}),
    )
    list_display = ("username", "email", "role", "organization", "is_staff", "is_active")
    list_filter = ("role", "organization", "is_staff", "is_active")

