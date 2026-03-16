from django.db.models import Count
from rest_framework.decorators import api_view
from rest_framework.response import Response
from league.models import Player

@api_view(['GET'])
def division_counts(request):
    counts = (
        Player.objects
        .values('division__name')
        .annotate(count=Count('id'))
        .order_by('division__name')
    )

    data = [
        {
            "division": item["division__name"],
            "count": item["count"]
        }
        for item in counts
    ]

    return Response(data)