import os
import pandas as pd
from geopy.geocoders import Nominatim
from time import sleep
from geopy.exc import GeocoderTimedOut, GeocoderUnavailable
from django.core.management.base import BaseCommand
from django.conf import settings
from django.core.exceptions import ValidationError
from league.models import Player
from league.views import check_player_in_district, parse_kml
from league.services.division_mapper import map_division
from league.services.boolean_parser import parse_yes_no
from league.services.jersey_normalizer import normalize_jersey_size

class Command(BaseCommand):
    help = 'Updates players with district information'
    
    def import_enrollment_data(self):
        csv_file_path = os.path.join('static', 'Evaluation_Address.csv')
        if not os.path.exists(csv_file_path):
            print(f"File not found: {csv_file_path}")
            return False
        df = pd.read_csv(csv_file_path)
        geolocator = Nominatim(user_agent="myApp")
        failed_geocoding = []
        existing_players = []
        inserted_players_count = 0  # Track inserted players count

        max_retries = 3
        retry_delay = 2 

        for index, row in df.iterrows():
            first_name = row['Player First Name']
            last_name = row['Player Last Name']
            dob = row.get('Date of Birth')  # Assuming DOB is present in CSV
            teammate_request = row.get('Teammate Request')
            coach_request = row.get('Coach Request')
            jersey_size = row.get('Jersey Size')
            residency_same_raw = row.get("Is this player’s residency eligibility address the same as the primary account holder’s address?")
            residency_same = parse_yes_no(residency_same_raw)
            interested_showcase_raw = row.get("Is the player interested in trying out for Showcase (supplemental competitive games during the spring / summer season)?")
            interested_showcase = parse_yes_no(interested_showcase_raw)

            street_address = row['Player Street']
            city = row['Player City']
            state = row['Player State']
            postal_code = row['Player Postal Code']
            address = f"{street_address}, {city}, {state}, {postal_code}"

            print(f"Attempting to geocode: {address}")

            location = None
            retries = 0
            while retries < max_retries and location is None:
                try:
                    location = geolocator.geocode(address, timeout=10) 
                    if location:
                        print(f"Geocoding successful for: {address}")
                        break  
                    else:
                        print(f"Geocoding returned None for {address}")
                        break
                except (GeocoderTimedOut, GeocoderUnavailable) as e:
                    retries += 1
                    print(f"Geocoding failed for {address}. Retrying {retries}/{max_retries}...")
                    sleep(retry_delay) 
                except Exception as e:
                    print(f"Unexpected error occurred for {address}: {e}")
                    break  

            division = map_division(row["Division Name"])
            
            defaults = {
                "teammate_request": teammate_request,
                "coach_request": coach_request,
                "jersey_size": normalize_jersey_size(jersey_size),
                "residency_same": residency_same,
                "interested_showcase": interested_showcase,
                "street_address": street_address,
                "city": city,
                "state": state,
                "postal_code": postal_code,
                "division": division,
                "latitude": location.latitude if location else None,
                "longitude": location.longitude if location else None,
            }

            existing_player = Player.objects.filter(
                first_name=first_name,
                last_name=last_name,
                date_of_birth=dob,
            ).first()

            if existing_player:
                updated_fields = []

                for field, value in defaults.items():
                    current_value = getattr(existing_player, field)
                    if current_value != value:
                        updated_fields.append(field)
                        setattr(existing_player, field, value)

                if updated_fields:
                    existing_player.save()
                    print(f"Updated {first_name} {last_name}: {updated_fields}")
                else:
                    existing_players.append(f"{first_name} {last_name}")

            else:
                Player.objects.create(
                    first_name=first_name,
                    last_name=last_name,
                    date_of_birth=dob,
                    **defaults,
                )
                inserted_players_count += 1

            if not location:
                failed_geocoding.append(address) 
                print(f"Geocoding failed for {address} after {max_retries} retries.")

        # Write failed geocoding addresses to an output file
        if failed_geocoding:
            with open("output.txt", "w") as file:
                file.write("Geocoding failed for the following addresses:\n")
                for address in failed_geocoding:
                    file.write(f"{address}\n")
            print("Failed geocoding addresses have been written to output.txt.")

        # Write existing players to an output file
        if existing_players:
            with open("output_exists.txt", "w") as file:
                file.write("The following players already exist:\n")
                for player in existing_players:
                    file.write(f"{player}\n")
            print("Existing players have been written to output_exists.txt.")

        # Print summary counts
        print(f"Total players inserted: {inserted_players_count}")
        print(f"Total players already exist: {len(existing_players)}")

        return not failed_geocoding

    def handle(self, *args, **options):
        sleep(5)  # Introduce a time delay before execution
        success = self.import_enrollment_data()
        if success:
            print("Import enrollment data function executed.")
            # Fetch polygons from the KML file
            kml_path = os.path.join(settings.BASE_DIR, 'static', 'District8.kml')
            _, polygons = parse_kml(kml_path)  # Getting only polygons

            players = Player.objects.all()

            for player in players:
                self.stdout.write(f"Checking player: {player.first_name} {player.last_name}")

                # If the player does not have latitude or longitude, set district to False
                if player.latitude is None or player.longitude is None:
                    player.district = False  # Assuming district is a field in the Player model
                    player.save()
                    self.stdout.write(f"Player {player.first_name} {player.last_name} set to outside district due to missing coordinates.")
                else:
                    # Otherwise, check if the player is inside the district
                    check_player_in_district(player, polygons)

            self.stdout.write(self.style.SUCCESS('Successfully updated players with district information'))