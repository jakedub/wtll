from django.core.management.base import BaseCommand
from league.models import Player, Division

class Command(BaseCommand):
    help = 'Update players with the correct division'

    def handle(self, *args, **kwargs):
        players = Player.objects.all()
        for player in players:
            division_name = player.division.name if player.division else None
            if division_name in ['Intermediate (50/70) Baseball', 'Major Baseball', 'Junior (60/90) Baseball (Ages 12-14)', 'Major Baseball (Ages 11-12)', 'Senior (60/90) Baseball (Ages 13-16)']:
                player.division = Division.objects.get(name='majors')
            elif division_name in ['Pee Wee Baseball (Ages 5-6)']:
                player.division = Division.objects.get(name='peewee')
            elif division_name in ['Tee Ball Skills & Baseball (Age 4)']:
                player.division = Division.objects.get(name='teeball')
            elif division_name in ['Major Softball (Ages 11-12)']:
                player.division = Division.objects.get(name='major_softball')
            elif division_name in ['Minor Softball (Ages 7-10)']:
                player.division = Division.objects.get(name='minor_softball')
            elif division_name in ['Teen Softball (Ages 12-16)']:
                player.division = Division.objects.get(name='teen_softball')
            player.save()
            self.stdout.write(self.style.SUCCESS(f"Updated player {player.id} with division {player.division.name}"))