from rest_framework import serializers
from league.models import Player
from league.serializers.division_serializer import DivisionSerializer
from league.serializers.team_serializer import TeamSerializer
from league.serializers.position_serializer import PositionSerializer

class PlayerSerializer(serializers.ModelSerializer):
    team = TeamSerializer(read_only=True)
    division = DivisionSerializer(read_only=True)
    positions = PositionSerializer(many=True, read_only=True)
    evaluations = serializers.SerializerMethodField()

    # Computed fields from latest Evaluation
    tier_spot = serializers.IntegerField(read_only=True)
    pitcher_tier = serializers.CharField(read_only=True)
    catcher_tier = serializers.CharField(read_only=True)
    overall_total = serializers.IntegerField(read_only=True)
    total_pitching = serializers.IntegerField(read_only=True)
    total_catcher = serializers.IntegerField(read_only=True)

    class Meta:
        model = Player
        fields = [
            'id',
            'first_name',
            'last_name',
            'email',
            'date_of_birth',
            'team',
            'division',
            'address_line_1',
            'address_line_2',
            'city',
            'state',
            'zip_code',
            'latitude',
            'longitude',
            'in_district',
            'created_at',
            'updated_at',
            'evaluations',
            'positions',
            'program',
            'sport',
            'batting_hand',
            'throwing_hand',
            'is_allstar',
            'is_showcase',
            'teammate_request',
            'coach_request',
            'jersey_size',
            'residency_same',
            'interested_showcase',
            'is_eligible',
            'school_name',
            'overall_total',
            'total_pitching',
            'total_catcher',
            'tier_spot',
            'tier',  # optional if you want a string label for UI
            'pitcher_tier',
            'catcher_tier'
        ]

    def get_evaluations(self, obj):
        from league.serializers.evaluation_serializer import EvaluationSerializer
        return EvaluationSerializer(obj.evaluations.all(), many=True).data