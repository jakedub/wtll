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

class Command(BaseCommand):
    help = 'Updates players with district information'
    
    def import_enrollment_data(self):
        from ...models import Player, Division  # Updated import to Division
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

            # Check if player already exists
            if Player.objects.filter(first_name=first_name, last_name=last_name).exists():
                existing_players.append(f"{first_name} {last_name}")
                continue

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

            division_name = row['Division Name']
            division, created = Division.objects.get_or_create(name=division_name)

            player = Player(
                first_name=first_name,
                last_name=last_name,
                street_address=street_address,
                city=city,
                state=state,
                postal_code=postal_code,
                division=division,
                latitude=location.latitude if location else None,
                longitude=location.longitude if location else None,
                district=True if location else False
            )
            player.save()
            inserted_players_count += 1  # Increment inserted players count
            print(f"Player {player.first_name} {player.last_name} saved.")

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