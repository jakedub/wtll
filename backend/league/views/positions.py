from league.models import Position
from league.serializers.position_serializer import PositionSerializer
from rest_framework import viewsets

class PositionViewSet(viewsets.ModelViewSet):
    queryset = Position.objects.all()
    serializer_class = PositionSerializer