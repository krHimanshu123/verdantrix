from rest_framework.response import Response


def success_response(data=None, message="Request completed successfully.", status_code=200):
    return Response({"status": "success", "message": message, "data": data}, status=status_code)


def error_response(message="Request failed.", errors=None, status_code=400):
    payload = {"status": "error", "message": message}
    if errors is not None:
        payload["errors"] = errors
    return Response(payload, status=status_code)
