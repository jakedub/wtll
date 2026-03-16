from rest_framework import viewsets
from rest_framework.views import APIView
from rest_framework import status
from rest_framework.response import Response
from league.models.players import Player
from league.serializers import PlayerSerializer
from league.utils.district import determine_player_eligibility
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework.permissions import AllowAny
from rest_framework.authentication import BasicAuthentication

@method_decorator(csrf_exempt, name='dispatch')

@method_decorator(csrf_exempt, name='dispatch')

class PlayerViewSet(viewsets.ModelViewSet):
    queryset = Player.objects.all().order_by('last_name', 'first_name')
    serializer_class = PlayerSerializer


class PlayerWithoutEvaluationsView(APIView):
    def get(self, request, *args, **kwargs):
        players = Player.get_players_with_no_evaluations()
        serializer = PlayerSerializer(players, many=True)
        return Response(serializer.data)
    
@method_decorator(csrf_exempt, name='dispatch')

class CheckPlayerEligibilityView(APIView):
    authentication_classes = [BasicAuthentication]
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        try:
            players = Player.objects.all()

            results = []
            eligible_schools = [
                'Crooked Creek Elementary School',
                'Fox Hill Elementary School',
                'Greenbriar Elementary School',
                'Nora Elementary School',
                'Spring Mill Elementary School',
                'Towne Meadow Elementary School',
                'Willow Lake Elementary School',
                'Brebeuf Jesuit Preparatory School',
                'Park Tudor',
                'St. Luke Catholic School',
                'St. Monica School',
                'Hasten Hebrew Academy',
                'Sycamore School',
                'Orchard School',
                'International Montessori School',
                'International School of Indiana',
            ]
            
            for player in players:
                player.is_eligible = determine_player_eligibility(player, [], eligible_schools)
                player.save(update_fields=["is_eligible"])


                results.append({
                    "player_id": player.id,
                    "first_name": player.first_name,
                    "last_name": player.last_name,
                    "is_eligible": player.is_eligible
                })

            return Response({"results": results}, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {"error": f"Failed to determine eligibility: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )