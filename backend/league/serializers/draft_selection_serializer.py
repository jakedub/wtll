from rest_framework import serializers
from league.models.draft_selection import DraftSelection
from league.models.draft import Draft
from league.models.players import Player
from league.models.teams import Team
from league.models.divisions import Division

class DraftSelectionSerializer(serializers.ModelSerializer):
    player_name = serializers.CharField(source='player.__str__', read_only=True)
    team_name = serializers.CharField(source='team.name', read_only=True)
    division_name = serializers.CharField(source='division.name', read_only=True)

    class Meta:
        model = DraftSelection
        fields = ['id', 'draft', 'player', 'player_name', 'team', 'team_name', 'division', 'division_name', 'selected_at']