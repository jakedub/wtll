from rest_framework import serializers
from league.models.draft import Draft
from league.serializers.draft_selection_serializer import DraftSelectionSerializer
from league.models.teams import Team

class DraftSerializer(serializers.ModelSerializer):
    selections = DraftSelectionSerializer(many=True, read_only=True)

    class Meta:
        model = Draft
        fields = ['id', 'name', 'year', 'division', 'created_at', 'is_complete', 'selections']
        read_only_fields = ['created_at', 'selections']

class DraftTeamSerializer(serializers.ModelSerializer):
    class Meta:
        model = Team
        fields = ['id', 'name', 'division']