from rest_framework import serializers
from league.models import Evaluation
from league.serializers.player_serializer import PlayerSerializer

class EvaluationSerializer(serializers.ModelSerializer):
    total_hitting = serializers.ReadOnlyField()
    total_fielding = serializers.ReadOnlyField()
    total_throwing = serializers.ReadOnlyField()
    total_pitching = serializers.ReadOnlyField()
    total_catcher = serializers.ReadOnlyField()
    tier_spot = serializers.ReadOnlyField()
    overall_total = serializers.ReadOnlyField()
    player = serializers.SerializerMethodField()

    class Meta:
        model = Evaluation
        fields = [
            'id',
            'player',
            'evaluator',
            'season_year',
            'evaluation_type',
            'hitting_power',
            'hitting_contact',
            'hitting_form',
            'fielding_form',
            'fielding_glove',
            'fielding_hustle',
            'throwing_form',
            'throwing_speed',
            'throwing_accuracy',
            'pitching_speed',
            'pitching_accuracy',
            'catcher_receiving',
            'catcher_blocking',
            'total_hitting',
            'total_fielding',
            'total_throwing',
            'total_pitching',
            'total_catcher',
            'overall_total',
            'tier_spot',
            'created_at',
        ]

    def get_player(self, obj):
        """Return only selected fields for the player."""
        player = obj.player
        return {
            "id": player.id,
            "first_name": player.first_name,
            "last_name": player.last_name,
            "team": {"id": player.team.id, "name": player.team.name} if player.team else None,
            "division": {"id": player.division.id, "name": player.division.name} if player.division else None,
            "positions": [{"id": p.id, "code": p.code} for p in player.positions.all()],
            "program": player.program,
            "sport": player.sport,
        }