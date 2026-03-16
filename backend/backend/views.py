from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET
from league.services.reporting import generate_reports
from league.services.geocoding import geocode_single_address, geocode_missing_players_batch

# --- Reporting view ---
@require_GET
def generate_reports_view(request):
    """
    Endpoint to generate reports using reporting service.
    """
    report_data = generate_reports()

    # Serialize QuerySets to lists for JSON
    report_serialized = {
        "total_players": report_data["total_players"],
        "players_without_evaluations": [
            {"id": p.id, "first_name": p.first_name, "last_name": p.last_name}
            for p in report_data["players_without_evaluations"]
        ],
        "out_of_district_players": [
            {"id": p.id, "first_name": p.first_name, "last_name": p.last_name}
            for p in report_data["out_of_district_players"]
        ],
        "players_by_district": report_data.get("players_by_district", {}),
    }
    return JsonResponse(report_serialized)

# --- Single address geocode view ---
@require_GET
def check_single_address(request):
    address = request.GET.get("address", "").strip()
    if not address:
        return JsonResponse({"error": "No address provided"}, status=400)

    lat, lng, error = geocode_single_address(address)
    if error:
        return JsonResponse({"address": address, "status": "FAILED", "reason": error}, status=400)

    return JsonResponse({"address": address, "latitude": lat, "longitude": lng, "status": "SUCCESS"})