from rest_framework import viewsets
from league.models.teams import Team
from league.serializers import TeamSerializer
from rest_framework.views import APIView
from rest_framework.response import Response
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework.permissions import AllowAny
from rest_framework.authentication import BasicAuthentication


@method_decorator(csrf_exempt, name='dispatch')
class TeamViewSet(viewsets.ModelViewSet):
    queryset = Team.objects.all().order_by('name')
    serializer_class = TeamSerializer
    permission_classes = [AllowAny]
    authentication_classes = []

class TeamsByDivisionView(APIView):
    def get(self, request, division_id: int, *args, **kwargs):
        # division_id now comes from the URL
        teams = Team.objects.filter(division_id=division_id, is_active=True)
        data = [{'id': t.id, 'name': t.name} for t in teams]
        return Response(data)