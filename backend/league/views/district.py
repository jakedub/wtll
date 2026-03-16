import os
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from league.utils.district import parse_kml, is_player_in_district
from django.conf import settings
from league.models.players import Player
from geopy.geocoders import Nominatim
import logging

class DistrictPolygonsView(APIView):
    """
    Returns district polygon coordinates as JSON.
    """
    def get(self, request, *args, **kwargs):
        try:
            kml_path = os.path.join(settings.BASE_DIR, 'static', 'District8.kml')
            coordinates, polygons = parse_kml(kml_path)
            return Response({
                "coordinates": coordinates,
                "polygons": polygons
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": f"Failed to load district polygons: {str(e)}"},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class CheckPlayersInDistrictView(APIView):
    """
    Accepts player data from frontend (with lat/lng),
    checks each player against district polygons, and returns results.
    """
    def post(self, request, *args, **kwargs):
        try:
            players_data = request.data.get("players", [])
            if not players_data:
                return Response({"error": "No player data provided."}, status=status.HTTP_400_BAD_REQUEST)

            # Load polygons once
            kml_path = os.path.join(settings.BASE_DIR, 'league', 'static', 'District8.kml')
            _, polygons = parse_kml(kml_path)

            logger = logging.getLogger(__name__)
            results = []

            for idx, row in enumerate(players_data):
                row_dict = row.copy()
                
                lat = row.get("latitude")
                lng = row.get("longitude")

                # Skip players without both lat/lng
                if lat is None or lng is None:
                    row_dict["status"] = "SKIPPED"
                    row_dict["in_district"] = None
                    results.append(row_dict)
                    continue

                # Check district
                in_district = is_player_in_district(lat, lng, polygons)
                row_dict["in_district"] = in_district
                row_dict["status"] = "SUCCESS" if in_district else "FAILED"
                results.append(row_dict)

            return Response({"results": results}, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({"error": f"Failed to check players in district: {str(e)}"},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    """
    Accepts player data from frontend, geocodes missing lat/lng,
    checks each player against district polygons, and returns augmented results.
    """
    def post(self, request, *args, **kwargs):
        try:
            players_data = request.data.get("players", [])
            print("TOTAL PLAYERS:", len(players_data))
            print("FIRST PLAYER:", players_data[0])
            if not players_data:
                return Response({"error": "No player data provided."}, status=status.HTTP_400_BAD_REQUEST)

            # Load polygons once
            kml_path = os.path.join(settings.BASE_DIR, 'static', 'District8.kml')
            _, polygons = parse_kml(kml_path)
            geolocator = Nominatim(user_agent="wtll_geocode")
            logger = logging.getLogger(__name__)
            results = []

            total = len(players_data)
            for idx, row in enumerate(players_data):
                if idx == 0 or (idx + 1) % 5 == 0 or (idx + 1) == total:
                    logger.info(f"CheckPlayersInDistrict: processing player {idx+1}/{total}")

                row_dict = row.copy()

                address_line_1 = str(row.get("address_line_1", "")).strip()
                address_line_2 = str(row.get("address_line_2", "")).strip()
                city = str(row.get("city", "")).strip()
                state = str(row.get("state", "")).strip()
                zip_code = str(row.get("zip", "")) or str(row.get("zip_code", ""))
                full_address = ", ".join(filter(None, [address_line_1, address_line_2, city, state, zip_code]))

                player = None
                if "player_id" in row:
                    try:
                        player = Player.objects.get(id=row["player_id"])
                    except Player.DoesNotExist:
                        player = None

                # Create temporary Player object if not in DB
                if not player:
                    player = Player(
                        first_name=row.get("first_name", ""),
                        last_name=row.get("last_name", ""),
                        address_line_1=address_line_1,
                        address_line_2=address_line_2,
                        city=city,
                        state=state,
                        zip_code=zip_code,
                    )

                # Geocode if missing
                if player.latitude is None or player.longitude is None:
                    try:
                        location = geolocator.geocode(full_address, timeout=10)
                        if location:
                            player.latitude = location.latitude
                            player.longitude = location.longitude
                            print('Checking', player.latitude, player.longitude)
                        else:
                            row_dict["geocode_error"] = "Address not found"
                    except Exception as e:
                        row_dict["geocode_error"] = str(e)

                # Check district
                if player.latitude is not None and player.longitude is not None:
                    player.in_district = is_player_in_district(player.latitude, player.longitude, polygons)
                    row_dict["status"] = "SUCCESS"
                else:
                    player.in_district = False
                    row_dict["status"] = "FAILED"

                row_dict["latitude"] = player.latitude
                row_dict["longitude"] = player.longitude
                row_dict["in_district"] = player.in_district

                # Save if player exists in DB
                if player.id:
                    player.save()

                results.append(row_dict)

            return Response({"results": results}, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({"error": f"Failed to check players in district: {str(e)}"},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)