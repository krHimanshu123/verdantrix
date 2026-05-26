from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from apps.normalization.models import NormalizedEmissionRecord
from apps.normalization.serializers import NormalizedEmissionRecordSerializer
from apps.reviews.serializers import AuthUserSerializer, RegisterSerializer, ReviewActionSerializer, VerdantrixTokenSerializer
from apps.reviews.services import execute_review_action
from common.responses import error_response, success_response
from common.utils import user_organization_id


@api_view(["POST"])
@permission_classes([AllowAny])
def register_view(request):
    serializer = RegisterSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = serializer.save()
    refresh = RefreshToken.for_user(user)
    return success_response(
        {
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user": AuthUserSerializer(user).data,
        },
        message="Account created successfully.",
        status_code=status.HTTP_201_CREATED,
    )


class AuthLoginView(TokenObtainPairView):
    permission_classes = [AllowAny]
    serializer_class = VerdantrixTokenSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return success_response(serializer.validated_data, message="Verdantrix authentication successful.")


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def auth_me_view(request):
    return success_response(AuthUserSerializer(request.user).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def review_action_view(request, pk: int):
    serializer = ReviewActionSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    try:
        queryset = NormalizedEmissionRecord.objects.all()
        organization_id = user_organization_id(request.user)
        if organization_id:
            queryset = queryset.filter(organization_id=organization_id)
        record = queryset.get(pk=pk)
    except NormalizedEmissionRecord.DoesNotExist:
        return error_response("Verdantrix record not found.", status_code=status.HTTP_404_NOT_FOUND)

    try:
        updated_record = execute_review_action(
            record=record,
            user=request.user,
            action=serializer.validated_data["action"],
            analyst_notes=serializer.validated_data.get("analyst_notes", ""),
        )
    except ValueError as exc:
        return error_response(str(exc), status_code=status.HTTP_409_CONFLICT)

    return success_response(
        NormalizedEmissionRecordSerializer(updated_record).data,
        message="Verdantrix review action completed successfully.",
        status_code=status.HTTP_200_OK,
    )
