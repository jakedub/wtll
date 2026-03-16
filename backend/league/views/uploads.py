import pandas as pd
import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser
from django.core.exceptions import ValidationError
from geopy.geocoders import Nominatim
from league.utils.district import load_district_polygons, is_player_in_district
from league.models.players import Player
from league.services.player_import import import_players_from_csv

class UploadCSVView(APIView):
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request, *args, **kwargs):
        file = request.FILES.get("file")
        if not file:
            return Response({"error": "No file uploaded"}, status=status.HTTP_400_BAD_REQUEST)
        if not file.name.endswith(".csv"):
            return Response({"error": "File must be a CSV"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            df = pd.read_csv(file)
            required_columns = [
                "Player First Name",
                "Player Last Name",
                "Player Street",
                "Player City",
                "Player State",
                "Player Postal Code"
            ]
            for column in required_columns:
                if column not in df.columns:
                    raise ValidationError(f"Missing required column: {column}")
            return Response(df.to_dict(orient="records"), status=status.HTTP_200_OK)
        except ValidationError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": f"Failed to process file: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class CheckCsvDistrictView(APIView):
    """
    Accepts a CSV file, geocodes addresses when lat/lng are missing,
    checks each row against district polygons, and returns augmented results.
    """
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request, *args, **kwargs):
        file = request.FILES.get("file")
        if not file:
            return Response({"error": "No file uploaded"}, status=status.HTTP_400_BAD_REQUEST)
        if not file.name.endswith(".csv"):
            return Response({"error": "File must be a CSV"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            df = pd.read_csv(file)
            MAX_ROWS = 500
            if len(df) > MAX_ROWS:
                return Response(
                    {"error": f"CSV has too many rows (max {MAX_ROWS}). Split into smaller files."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            polygons = load_district_polygons()
            geolocator = Nominatim(user_agent="wtll_geocode")
            results = []
            logger = logging.getLogger(__name__)
            total = len(df)
            for idx, row in df.iterrows():
                row_dict = row.to_dict()
                if idx == 0 or (idx + 1) % 5 == 0 or (idx + 1) == total:
                    logger.info(f"CheckCsvDistrict: processing row {idx+1}/{total}")
                address_line_1 = str(row.get("Player Street", "")).strip()
                city = str(row.get("Player City", "")).strip()
                state = str(row.get("Player State", "")).strip()
                zip_code = str(row.get("Player Postal Code", "")).strip()
                full_address = ", ".join(filter(None, [address_line_1, city, state, zip_code]))
                player, created = Player.objects.get_or_create(
                    address_line_1=address_line_1,
                    city=city,
                    state=state,
                    zip_code=zip_code,
                )
                if player.latitude is None or player.longitude is None:
                    try:
                        location = geolocator.geocode(full_address, timeout=10)
                        if location:
                            player.latitude = location.latitude
                            player.longitude = location.longitude
                    except Exception as e:
                        row_dict["geocode_error"] = str(e)
                if player.latitude is not None and player.longitude is not None:
                    player.in_district = is_player_in_district(player.latitude, player.longitude, polygons)
                else:
                    player.in_district = False
                player.save()
                row_dict["latitude"] = player.latitude
                row_dict["longitude"] = player.longitude
                row_dict["in_district"] = player.in_district
                results.append(row_dict)
            return Response({"results": results}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": f"Failed to process file: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class UploadCSVPlayersView(APIView):
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request, *args, **kwargs):
        file = request.FILES.get("file")
        if not file:
            return Response({"error": "No file uploaded"}, status=status.HTTP_400_BAD_REQUEST)
        if not file.name.endswith(".csv"):
            return Response({"error": "File must be a CSV"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            df = pd.read_csv(file)
            required_columns = [
                "Player First Name",
                "Player Last Name",
                "Player Street",
                "Player City",
                "Player State",
                "Player Postal Code",
            ]
            for column in required_columns:
                if column not in df.columns:
                    raise ValidationError(f"Missing required column: {column}")
            file.seek(0)
            processed_players = import_players_from_csv(file)
            results = [
                {
                    "id": p.id,
                    "first_name": p.first_name,
                    "last_name": p.last_name,
                    "address_line_1": p.address_line_1,
                }
                for p in processed_players
            ]
            return Response({"results": results}, status=status.HTTP_200_OK)
        except ValidationError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": f"Failed to process file: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)