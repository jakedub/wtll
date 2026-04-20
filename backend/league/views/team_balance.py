# backend/league/views/team_balance.py
from rest_framework.views import APIView
from rest_framework.response import Response
from league.models.players import Player
from league.models.teams import Team
from typing import List, Dict

# Scoring maps
TIER_POINTS = {
    "Tier 1": 5,
    "Tier 2": 4,
    "Tier 3": 3,
    "Tier 4": 2,
    "Tier 5": 1
}

PITCHER_POINTS = {
    "Ace": 5,
    "Strong": 3,
    "Development": 1,
    "None": 0
}

CATCHER_POINTS = {
    "Elite": 4,
    "Strong": 2,
    "Emergency": 1,
    "None": 0
}

def calculate_player_value(player: Player) -> int:
    tier = player.tier_spot or "Tier 5"
    pitcher = player.pitcher_tier or "None"
    catcher = player.catcher_tier or "None"
    return TIER_POINTS.get(tier, 0) + PITCHER_POINTS.get(pitcher, 0) + CATCHER_POINTS.get(catcher, 0)

class TeamBalanceAPIView(APIView):
    """
    Returns team scores and disparities for a given division, including teams with no players.
    """
    def get(self, request, division_id: int):
        # Get all teams in this division
        teams = Team.objects.filter(division_id=division_id)
        players = Player.objects.filter(division_id=division_id).select_related('team')

        # Group players by team_id
        teams_players: Dict[int, List[Player]] = {}
        for player in players:
            if player.team:
                teams_players.setdefault(player.team.id, []).append(player)

        # Calculate score per team, defaulting to 0 if no players
        result = []
        for team in teams:
            team_players = teams_players.get(team.id, [])
            score = sum(calculate_player_value(p) for p in team_players)
            num_players = len(team_players)
            result.append({
                "team_id": team.id,
                "team_name": team.name,
                "score": score,
                "num_players": num_players,
            })

        # Compute average score across all teams (avoid division by 0)
        avg_score = sum(t["score"] for t in result) / len(result) if result else 0

        # Add disparity field
        for t in result:
            t["disparity"] = t["score"] - avg_score

        return Response({
            "division_id": division_id,
            "average_score": avg_score,
            "teams": result
        })