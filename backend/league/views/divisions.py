from rest_framework import viewsets
from league.models.divisions import Division
from league.serializers import DivisionSerializer

class DivisionViewSet(viewsets.ModelViewSet):
    queryset = Division.objects.all().order_by('name')
    serializer_class = DivisionSerializer