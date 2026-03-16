# league/views/fielding.py
import random
from rest_framework.decorators import api_view
from rest_framework.response import Response
from league.models import Player, Team

# List of field positions
FIELD_POSITIONS = [
    "Pitcher", "Catcher", "First Base", "Second Base",
    "Third Base", "Shortstop", "Left Field", "Center Field", "Right Field"
]

@api_view(['POST'])
def assign_random_fielding(request, team_id: int):
    """
    Assign players to random positions, respecting eligible positions.
    """
    try:
        team = Team.objects.get(id=team_id)
        players = team.players.all()

        assignments = {}
        available_positions = FIELD_POSITIONS.copy()

        for player in players:
            # Filter positions player can play
            eligible_positions = [pos for pos in available_positions if pos in [p.code for p in player.positions]]
            if not eligible_positions:
                # If no eligible positions left, skip player
                continue

            assigned = random.choice(eligible_positions)
            assignments[player.id] = assigned
            available_positions.remove(assigned)  # prevent duplicates

        return Response(assignments)

    except Team.DoesNotExist:
        return Response({"error": "Team not found"}, status=404)