from django.http import JsonResponse
from django.views.decorators.http import require_GET


@require_GET
def health_view(request):
    """Lightweight liveness probe that does not require authentication."""
    return JsonResponse({"status": "ok", "service": "verdantrix-api"})
