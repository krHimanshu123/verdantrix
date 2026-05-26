from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework.exceptions import ValidationError
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from apps.organizations.models import Organization
from common.constants import ACTION_APPROVE, ACTION_LOCK, ACTION_NOTE, ACTION_REJECT

User = get_user_model()


class AuthUserSerializer(serializers.ModelSerializer):
    organization_name = serializers.CharField(source="organization.name", read_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "role",
            "organization",
            "organization_name",
            "created_at",
        ]


class RegisterSerializer(serializers.Serializer):
    organization_name = serializers.CharField(max_length=255)
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True, min_length=8)

    def validate_organization_name(self, value: str) -> str:
        normalized = value.strip()
        if len(normalized) < 2:
            raise ValidationError("Organization name is required.")
        return normalized

    def validate_username(self, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValidationError("Username is required.")
        if User.objects.filter(username__iexact=normalized).exists():
            raise ValidationError("A user with this username already exists.")
        return normalized

    def validate_email(self, value: str) -> str:
        normalized_email = value.strip().lower()
        if User.objects.filter(email__iexact=normalized_email).exists():
            raise ValidationError("A user with this email already exists.")
        return normalized_email

    def validate_password(self, value: str) -> str:
        validate_password(value)
        return value

    def validate(self, attrs: dict):
        if attrs.get("password") != attrs.get("confirm_password"):
            raise ValidationError({"confirm_password": "Passwords do not match."})
        return attrs

    def create(self, validated_data):
        organization_name = validated_data["organization_name"].strip()
        username = validated_data["username"].strip()
        email = validated_data["email"].strip().lower()
        password = validated_data["password"]

        organization = Organization.objects.filter(name__iexact=organization_name).first()
        if not organization:
            organization = Organization.objects.create(
                name=organization_name,
                industry="Unknown",
                country="Unknown",
            )

        user = User(
            username=username,
            email=email,
            role=getattr(User, "ROLE_ANALYST", "analyst"),
            organization=organization,
        )
        user.set_password(password)
        user.save()
        return user


class VerdantrixTokenSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["username"] = user.username
        token["email"] = user.email
        token["role"] = user.role
        token["organization_id"] = user.organization_id
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data["user"] = AuthUserSerializer(self.user).data
        return data


class ReviewActionSerializer(serializers.Serializer):
    action = serializers.ChoiceField(choices=[ACTION_APPROVE, ACTION_REJECT, ACTION_NOTE, ACTION_LOCK])
    analyst_notes = serializers.CharField(required=False, allow_blank=True)
