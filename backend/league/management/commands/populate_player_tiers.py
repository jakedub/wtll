# league/management/commands/backfill_player_tiers.py
from django.core.management.base import BaseCommand
from league.models.players import Player

class Command(BaseCommand):
    help = "Trigger any saves for players; tiers are computed dynamically from evaluations"

    def handle(self, *args, **options):
        players = Player.objects.all()
        updated_count = 0

        for player in players:
            # No need to assign to computed properties
            # Just save if you want to update other fields or trigger signals
            player.save()
            updated_count += 1

        self.stdout.write(self.style.SUCCESS(f"Processed {updated_count} players. Tiers computed dynamically."))