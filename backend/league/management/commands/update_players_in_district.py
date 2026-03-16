from django.core.management.base import BaseCommand
from django.conf import settings
from django.core.exceptions import ValidationError
from league.models import Player
from league.views import check_player_in_district, parse_kml
import os

class Command(BaseCommand):
    help = 'Updates players with district information'

    def handle(self, *args, **options):
        # Fetch polygons from the KML file
        kml_path = os.path.join(settings.BASE_DIR, 'static', 'District8.kml')
        _, polygons = parse_kml(kml_path)  # Getting only polygons

        # Get all players
        players = Player.objects.all()

        # Check if each player is inside a district
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