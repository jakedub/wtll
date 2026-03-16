from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from league.models.players import Player
from league.services.geocoding import geocode_single_address


class GeocodeMissingPlayersView(APIView):
    """
    Geocode all players missing latitude/longitude and return
    both successes and failures for UI reporting.
    """

    def post(self, request, *args, **kwargs):
        players = Player.objects.filter(latitude__isnull=True, longitude__isnull=True)

        results = []
        failures = []

        for player in players:
            full_address = ", ".join(filter(None, [
                player.address_line_1,
                player.address_line_2,
                player.city,
                player.state,
                player.zip_code
            ]))

            try:
                lat, lng, error = geocode_single_address(full_address)

                if error or lat is None or lng is None:
                    failures.append({
                        "player_id": player.id,
                        "first_name": player.first_name,
                        "last_name": player.last_name,
                        "address": full_address,
                        "latitude": None,
                        "longitude": None,
                        "status": "FAILED",
                        "error": error or "Unknown geocoding error",
                    })
                    continue

                # Success
                player.latitude = lat
                player.longitude = lng
                player.save(update_fields=["latitude", "longitude"])

                results.append({
                    "player_id": player.id,
                    "first_name": player.first_name,
                    "last_name": player.last_name,
                    "address": full_address,
                    "latitude": lat,
                    "longitude": lng,
                    "status": "SUCCESS",
                    "error": None,
                })

            except Exception as e:
                failures.append({
                    "player_id": player.id,
                    "first_name": player.first_name,
                    "last_name": player.last_name,
                    "address": full_address,
                    "latitude": None,
                    "longitude": None,
                    "status": "FAILED",
                    "error": str(e),
                })

        return Response(
            {
                "results": results,
                "failures": failures,
                "summary": {
                    "total": len(players),
                    "success": len(results),
                    "failed": len(failures),
                }
            },
            status=status.HTTP_200_OK
        )