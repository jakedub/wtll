from rest_framework import serializers
from league.models.draft import Draft
from league.models.players import Player
from league.models.teams import Team
from league.models.divisions import Division
from league.serializers.draft_selection_serializer import DraftSelectionSerializer



class DraftTeamSerializer(serializers.ModelSerializer):
    class Meta:
        model = Team
        fields = ['id', 'name', 'division', 'team']


class DraftSerializer(serializers.ModelSerializer):
    selections = DraftSelectionSerializer(many=True, read_only=True)

    class Meta:
        model = Draft
        fields = ['id', 'name', 'year', 'created_at', 'selections']