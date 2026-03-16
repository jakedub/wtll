from rest_framework import viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from league.models.evaluations import Evaluation
from league.serializers import EvaluationSerializer

class EvaluationViewSet(viewsets.ModelViewSet):
    queryset = Evaluation.objects.all().order_by('-season_year', 'evaluation_type')
    serializer_class = EvaluationSerializer


class EvaluationListViewByDivision(APIView):
    def get(self, request, division_id, *args, **kwargs):
        evaluations = Evaluation.objects.filter(player__team__division_id=division_id)
        serializer = EvaluationSerializer(evaluations, many=True)
        return Response(serializer.data)
    
