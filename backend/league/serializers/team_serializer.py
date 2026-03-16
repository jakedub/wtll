from rest_framework import serializers
from league.serializers.division_serializer import DivisionSerializer
from league.models import Team

class TeamSerializer(serializers.ModelSerializer):
    division = DivisionSerializer(read_only=True)
    class Meta:
        model = Team
        fields = ['id', 'name', 'coach', 'year', 'division', 'is_active']
    year = serializers.IntegerField()