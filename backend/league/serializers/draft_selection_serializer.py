from rest_framework import serializers
from league.models.draft_selection import DraftSelection
from league.models.players import Player
from league.models.teams import Team
from league.models.divisions import Division

class DraftSelectionSerializer(serializers.ModelSerializer):
    # Provide readable names for related objects
    player_name = serializers.CharField(source='player.__str__', read_only=True)
    team_name = serializers.CharField(source='team.name', read_only=True)
    division_name = serializers.CharField(source='division.name', read_only=True)

    class Meta:
        model = DraftSelection
        # Include both IDs for API consumption and human-readable names
        fields = [
            'id',
            'draft',           # ID of the draft
            'player',          # ID of the player
            'player_name',     # Readable player name
            'team',            # ID of the team
            'team_name',       # Readable team name
            'division',        # ID of the division
            'division_name',   # Readable division name
            'selected_at',     # Timestamp of pick
        ]
        read_only_fields = ['player_name', 'team_name', 'division_name', 'selected_at']