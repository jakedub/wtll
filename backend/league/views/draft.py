from rest_framework import generics, status
from rest_framework import viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from league.models.draft import Draft 
from league.models.draft_selection import DraftSelection
from league.models.players import Player
from league.models.teams import Team
from league.models.divisions import Division
from league.models.evaluations import Evaluation
from datetime import datetime
from league.serializers.draft_serializer import DraftSerializer, DraftSelectionSerializer
from django.db import transaction
from django.db.models import Q


class DraftViewSet(viewsets.ModelViewSet):
    queryset = Draft.objects.all().order_by('-year')
    serializer_class = DraftSerializer

# Get available players for a draft filtered by division
class AvailablePlayersView(APIView):
    
     
    def get(self, request, draft_id):
        division_id = request.query_params.get('division')
        try:
            draft = Draft.objects.get(id=draft_id)
        except Draft.DoesNotExist:
            return Response({'detail': 'Draft not found'}, status=status.HTTP_404_NOT_FOUND)

        drafted_player_ids = DraftSelection.objects.filter(draft=draft).values_list('player_id', flat=True)

        available_players = Player.objects.filter(
            is_eligible=True,
            division_id=division_id
        ).exclude(id__in=drafted_player_ids)
        current_year = datetime.now().year
        

        data = []
        for p in available_players:
            # Get evaluation for current season
            current_eval = p.evaluations.filter(season_year=current_year).first()

            # If evaluation exists, fetch scores; else leave None
            total_hitting = getattr(current_eval, 'total_hitting', None) or None
            total_fielding = getattr(current_eval, 'total_fielding', None) or None
            total_throwing = getattr(current_eval, 'total_throwing', None) or None
            total_pitching = getattr(current_eval, 'total_pitching', None) or None
            total_catcher = getattr(current_eval, 'total_catcher', None) or None
            tier_spot = getattr(current_eval, 'tier_spot', None) or None
            overall_total = getattr(current_eval, 'overall_total', None) or None
            pitcher_tier = getattr(p, 'pitcher_tier', None)
            catcher_tier = getattr(p, 'catcher_tier', None)

            data.append({
                'id': p.id,
                'name': f"{p.first_name} {p.last_name}",
                'batting_hand': getattr(p, 'batting_hand', None),
                'throwing_hand': getattr(p, 'throwing_hand', None),
                'team_name': p.team.name if p.team else '',
                'division_name': p.division.name if p.division else '',
                'total_hitting': total_hitting,
                'total_fielding': total_fielding,
                'total_throwing': total_throwing,
                'total_pitching': total_pitching,
                'total_catcher': total_catcher,
                'overall_total': overall_total,
                'tier_spot': tier_spot,
                'is_pitcher': total_pitching is not None and total_pitching > 0,
                'is_catcher': total_catcher is not None and total_catcher > 0,
                'pitcher_tier': pitcher_tier,
                'catcher_tier': catcher_tier
            })
        return Response(data)

# Draft a player (bulk) and undo selections
class DraftPlayerView(APIView):
    """
    POST: Draft one or multiple players
        {
            "team_id": 1,
            "division_id": 2,
            "player_ids": [5, 7, 9]
        }

    DELETE: Undo a selection
        {
            "team_id": 1,
            "division_id": 2,
            "player_ids": [5, 7]
        }
    """
    def post(self, request, draft_id):
        player_ids = request.data.get('player_ids', [])
        team_id = request.data.get('team_id')
        division_id = request.data.get('division_id')

        if not player_ids:
            return Response({'detail': 'No players provided'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            draft = Draft.objects.get(id=draft_id)
            team = Team.objects.get(id=team_id)
            division = Division.objects.get(id=division_id)
        except (Draft.DoesNotExist, Team.DoesNotExist, Division.DoesNotExist):
            return Response({'detail': 'Invalid draft, team, or division'}, status=status.HTTP_400_BAD_REQUEST)

        if team.division.id != division.id:
            return Response({'detail': 'Team division does not match selected division'}, status=status.HTTP_400_BAD_REQUEST)

        created_selections = []
        failures = []

        with transaction.atomic():
            for pid in player_ids:
                try:
                    player = Player.objects.get(id=pid)
                except Player.DoesNotExist:
                    failures.append(f'Player id {pid} not found')
                    continue

                if DraftSelection.objects.filter(draft=draft, player=player).exists():
                    failures.append(f'{player} already drafted in this draft')
                    continue

                selection = DraftSelection.objects.create(
                    draft=draft,
                    player=player,
                    team=team,
                    division=division
                )
                created_selections.append(selection)

        serializer = DraftSelectionSerializer(created_selections, many=True)
        return Response({'created': serializer.data, 'failures': failures}, status=status.HTTP_201_CREATED)

    def delete(self, request, draft_id):
        player_ids = request.data.get('player_ids', [])
        team_id = request.data.get('team_id')
        division_id = request.data.get('division_id')

        if not player_ids:
            return Response({'detail': 'No players provided'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            draft = Draft.objects.get(id=draft_id)
            team = Team.objects.get(id=team_id)
            division = Division.objects.get(id=division_id)
        except (Draft.DoesNotExist, Team.DoesNotExist, Division.DoesNotExist):
            return Response({'detail': 'Invalid draft, team, or division'}, status=status.HTTP_400_BAD_REQUEST)

        deleted = []
        failures = []

        with transaction.atomic():
            for pid in player_ids:
                try:
                    selection = DraftSelection.objects.get(
                        draft=draft,
                        team=team,
                        division=division,
                        player_id=pid
                    )
                    selection.delete()
                    deleted.append(pid)
                except DraftSelection.DoesNotExist:
                    failures.append(f'Player id {pid} not assigned to this team/division in draft')

        return Response({'deleted_player_ids': deleted, 'failures': failures}, status=status.HTTP_200_OK)

# Team position counts
class DraftTeamStatsView(APIView):
    def get(self, request, draft_id):
        try:
            draft = Draft.objects.get(id=draft_id)
        except Draft.DoesNotExist:
            return Response({'detail': 'Draft not found'}, status=status.HTTP_404_NOT_FOUND)

        teams = Team.objects.all()
        stats = []

        for team in teams:
            selections = DraftSelection.objects.filter(draft=draft, team=team)

            # Count pitchers and catchers in Python using the evaluation fields
            pitchers = sum(1 for sel in selections if getattr(sel.player.evaluation, 'total_pitching', 0) > 0)
            catchers = sum(1 for sel in selections if getattr(sel.player.evaluation, 'total_catching', 0) > 0)

            stats.append({
                'team_id': team.id,
                'team_name': team.name,
                'pitchers': pitchers,
                'catchers': catchers
            })

        return Response(stats)

class DraftStateView(APIView):
    """
    Returns the draft state including available teams per division
    and current selections grouped by team.
    """
    def get(self, request, draft_id):
        try:
            draft = Draft.objects.get(id=draft_id)
        except Draft.DoesNotExist:
            return Response({'detail': 'Draft not found'}, status=404)

        # Get all divisions that have teams drafted in this draft
        selections = DraftSelection.objects.filter(draft=draft)

        # Get unique divisions from selections
        division_ids = selections.values_list('division_id', flat=True).distinct()

        division_teams = []
        for division_id in division_ids:
            teams_in_division = Team.objects.filter(division_id=division_id)
            division_teams.append({
                'division_id': division_id,
                'division_name': teams_in_division.first().division.name if teams_in_division.exists() else 'Unknown',
                'teams': [{'id': t.id, 'name': t.name} for t in teams_in_division]
            })

        # Optional: include current selections by team
        teams_with_selections = []
        for team in Team.objects.filter(id__in=selections.values_list('team_id', flat=True).distinct()):
            team_sel = selections.filter(team=team)
            # Count pitchers and catchers based on evaluation fields
            pitchers = team_sel.filter(player__evaluation__total_pitching__gt=0).count()
            catchers = team_sel.filter(player__evaluation__total_catching__gt=0).count()
            teams_with_selections.append({
                'team_id': team.id,
                'team_name': team.name,
                'pitchers': pitchers,
                'catchers': catchers
            })

        return Response({
            'draft': {
                'id': draft.id,
                'name': draft.name,
                'year': draft.year,
                'created_at': draft.created_at
            },
            'division_teams': division_teams,
            'teams_with_selections': teams_with_selections
        })