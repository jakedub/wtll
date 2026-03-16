import pandas as pd
import logging
from datetime import datetime
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser
from league.models.players import Player
from league.services.boolean_parser import parse_yes_no
from league.services.division_mapper import map_division
from league.services.jersey_normalizer import normalize_jersey_size
from league.serializers.player_serializer import PlayerSerializer

logger = logging.getLogger(__name__)

class UploadPlayersView(APIView):
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request, *args, **kwargs):
        logger.info(f"UploadPlayersView POST received. request.data keys: {list(request.data.keys())}")
        logger.info(f"UploadPlayersView FILES: {list(request.FILES.keys())}")
        file = request.FILES.get("file")
        if not file:
            return Response({"error": "No file uploaded"}, status=status.HTTP_400_BAD_REQUEST)
        if not file.name.endswith(".csv"):
            return Response({"error": "File must be a CSV"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            df = pd.read_csv(file, dtype=str)
            logger.info(f"CSV loaded successfully. Columns detected: {list(df.columns)}")
            logger.info(f"First row preview: {df.head(1).to_dict(orient='records')}")
        except Exception as e:
            logger.error(f"Failed to read CSV file: {e}")
            return Response({"error": "Invalid CSV file"}, status=status.HTTP_400_BAD_REQUEST)

        # Normalize headers
        def normalize_col(col):
            if isinstance(col, str):
                col = col.strip()
                col = col.replace("’", "'").replace("‘", "'").replace("“", '"').replace("”", '"')
            return col

        df.columns = [normalize_col(col) for col in df.columns]
        df.fillna("", inplace=True)

        required_columns = [
            "Player First Name",
            "Player Last Name",
            "Player Street",
            "Player City",
            "Player State",
            "Player Postal Code",
            "Player Birth Date",
            "Teammate Request",
            "Coach Request",
            "Little League School Name"
        ]

        optional_columns = {
            "Division Name": None,
            "Jersey Size": None,
            "Is this player’s residency eligibility address the same as the primary account holder’s address?": None,
            "Is the player interested in trying out for Showcase (supplemental competitive games during the spring / summer season)?": None
        }

        for col in required_columns:
            if col not in df.columns:
                return Response({"error": f"Missing required column: {col}"}, status=status.HTTP_400_BAD_REQUEST)

        for col in optional_columns.keys():
            optional_columns[col] = col if col in df.columns else None

        inserted_ids = []
        updated_ids = []
        failures = []

        for idx, row in df.iterrows():
            row_num = idx + 2
            try:
                first_name = str(row.get("Player First Name", "") or "").strip()
                last_name = str(row.get("Player Last Name", "") or "").strip()
                address = str(row.get("Player Street", "") or "").strip()
                city = str(row.get("Player City", "") or "").strip()
                state = str(row.get("Player State", "") or "").strip()
                postal_code = str(row.get("Player Postal Code", "") or "").strip()
                teammate_request = str(row.get("Teammate Request", "") or "").strip()
                coach_request = str(row.get("Coach Request", "") or "").strip()
                # CSV column "Little League School Name" maps to Player.school_name
                school_name = str(row.get("Little League School Name", "") or "").strip()


                division_name = str(row.get(optional_columns.get("Division Name") or "", "")).strip()
                jersey_size_raw = str(row.get(optional_columns.get("Jersey Size") or "", "")).strip()
                residency_raw = str(row.get(optional_columns.get("Is this player’s residency eligibility address the same as the primary account holder’s address?") or "", "")).strip()
                showcase_raw = str(row.get(optional_columns.get("Is the player interested in trying out for Showcase (supplemental competitive games during the spring / summer season)?") or "", "")).strip()

                # Parse birth date
                dob_str = str(row.get("Player Birth Date", "") or "").strip()
                dob_str = dob_str.replace("“", "").replace("”", "").replace('"', '').replace("'", "")
                date_of_birth_obj = None
                if dob_str:
                    try:
                        date_of_birth_obj = datetime.strptime(dob_str, "%m/%d/%y").date()
                    except ValueError:
                        try:
                            date_of_birth_obj = datetime.strptime(dob_str, "%m/%d/%Y").date()
                        except ValueError:
                            raise ValueError(f"Invalid date_of_birth format at row {row_num}: {dob_str}")

                # Optional fields
                residency_same = parse_yes_no(residency_raw)
                interested_showcase = parse_yes_no(showcase_raw)
                division_mapped = map_division(division_name) if division_name else None
                jersey_size_normalized = normalize_jersey_size(jersey_size_raw) if jersey_size_raw else None

                defaults = {
                    "address_line_1": address,
                    "city": city,
                    "state": state,
                    "zip_code": postal_code,
                    "teammate_request": teammate_request,
                    "coach_request": coach_request,
                    "residency_same": residency_same,
                    "interested_showcase": interested_showcase,
                    "division": division_mapped,
                    "jersey_size": jersey_size_normalized,
                    "school_name": school_name
                }

                # Use first_name + last_name + date_of_birth for uniqueness
                player_qs = Player.objects.filter(
                    first_name=first_name,
                    last_name=last_name,
                    date_of_birth=date_of_birth_obj
                )

                if player_qs.count() > 1:
                    logger.warning(f"Multiple players found for {first_name} {last_name} ({dob_str}) at row {row_num}, skipping update")
                    failures.append({"row": row_num, "error": "Multiple players match, skipping"})
                    continue
                elif player_qs.exists():
                    player_obj = player_qs.first()
                    for field, value in defaults.items():
                        setattr(player_obj, field, value)
                    player_obj.save()
                    updated_ids.append(player_obj.id)
                    logger.info(f"Updated player id={player_obj.id} row={row_num}")
                else:
                    player_obj = Player.objects.create(first_name=first_name, last_name=last_name, date_of_birth=date_of_birth_obj, **defaults)
                    inserted_ids.append(player_obj.id)
                    logger.info(f"Inserted player id={player_obj.id} row={row_num}")

            except Exception as e:
                logger.error(f"Failed processing row {row_num}: {e}")
                failures.append({"row": row_num, "error": str(e)})
        response_data = {
            "inserted": PlayerSerializer(Player.objects.filter(id__in=inserted_ids), many=True).data,
            "updated": PlayerSerializer(Player.objects.filter(id__in=updated_ids), many=True).data,
            "failures": failures
        }
        return Response(response_data, status=status.HTTP_200_OK)