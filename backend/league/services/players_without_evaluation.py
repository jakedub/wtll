import os
import csv
from time import sleep
from django.core.management.base import BaseCommand
from django.conf import settings
from django.core.exceptions import ValidationError
from league.models import Player

class Command(BaseCommand):
    help = 'Export players without an evaluation to CSV (First Name, Last Name, Division)'

    def handle(self, *args, **options):
        # Get players without an evaluation
        players_without_evaluation = Player.objects.filter(evaluations__isnull=True).select_related('division')

        # Define CSV file path
        csv_file_path = 'players_without_evaluations.csv'

        # Open the CSV file for writing
        with open(csv_file_path, mode='w', newline='') as file:
            writer = csv.writer(file)

            # Write the header row
            writer.writerow(['First Name', 'Last Name', 'Division'])

            # Write data for each player without evaluation
            for player in players_without_evaluation:
                writer.writerow([player.first_name, player.last_name, player.division.name if player.division else 'No Division'])

        self.stdout.write(self.style.SUCCESS(f'Successfully exported players without evaluations to {csv_file_path}'))