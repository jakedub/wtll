from rest_framework import viewsets, status
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
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
import traceback


@method_decorator(csrf_exempt, name='dispatch')
class DraftViewSet(viewsets.ModelViewSet):
    queryset = Draft.objects.all().order_by('-year')
    serializer_class = DraftSerializer


@method_decorator(csrf_exempt, name='dispatch')
class AvailablePlayersView(APIView):

    def get(self, request, draft_id):
        try:
            division_id = request.query_params.get('division')
            draft = Draft.objects.get(id=draft_id)
            drafted_player_ids = DraftSelection.objects.filter(draft=draft).values_list('player_id', flat=True)
            available_players = Player.objects.filter(
                is_eligible=True,
                division_id=division_id
            ).exclude(id__in=drafted_player_ids)
            current_year = datetime.now().year

            data = []
            for p in available_players:
                current_eval = p.evaluations.filter(season_year=current_year).first()
                data.append({
                    'id': p.id,
                    'name': f"{p.first_name} {p.last_name}",
                    'batting_hand': getattr(p, 'batting_hand', None),
                    'throwing_hand': getattr(p, 'throwing_hand', None),
                    'team_name': p.team.name if p.team else '',
                    'division_name': p.division.name if p.division else '',
                    'total_hitting': getattr(current_eval, 'total_hitting', None) if current_eval else None,
                    'total_fielding': getattr(current_eval, 'total_fielding', None) if current_eval else None,
                    'total_throwing': getattr(current_eval, 'total_throwing', None) if current_eval else None,
                    'total_pitching': getattr(current_eval, 'total_pitching', None) if current_eval else None,
                    'total_catcher': getattr(current_eval, 'total_catcher', None) if current_eval else None,
                    'overall_total': getattr(current_eval, 'overall_total', None) if current_eval else None,
                    'tier_spot': getattr(current_eval, 'tier_spot', None) if current_eval else None,
                    'is_pitcher': bool(getattr(current_eval, 'total_pitching', 0) or 0),
                    'is_catcher': bool(getattr(current_eval, 'total_catcher', 0) or 0),
                    'pitcher_tier': getattr(p, 'pitcher_tier', None),
                    'catcher_tier': getattr(p, 'catcher_tier', None),
                })
            return Response(data)
        except Exception as e:
            traceback.print_exc()
            return Response({'detail': str(e), 'type': type(e).__name__}, status=500)


@method_decorator(csrf_exempt, name='dispatch')
class DraftPlayerView(APIView):

    def post(self, request, draft_id):
        try:
            player_ids = request.data.get('player_ids', [])
            team_id = request.data.get('team_id')
            division_id = request.data.get('division_id')

            if not player_ids:
                return Response({'detail': 'No players provided'}, status=status.HTTP_400_BAD_REQUEST)

            draft = Draft.objects.get(id=draft_id)
            team = Team.objects.get(id=team_id)
            division = Division.objects.get(id=division_id)

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
                        draft=draft, player=player, team=team, division=division
                    )
                    created_selections.append(selection)

            serializer = DraftSelectionSerializer(created_selections, many=True)
            return Response({'created': serializer.data, 'failures': failures}, status=status.HTTP_201_CREATED)

        except Exception as e:
            traceback.print_exc()
            return Response({'detail': str(e), 'type': type(e).__name__}, status=500)

    def delete(self, request, draft_id):
        try:
            player_ids = request.data.get('player_ids')
            if not player_ids:
                single_player = request.data.get('player_id')
                player_ids = [single_player] if single_player else []
            team_id = request.data.get('team_id')
            division_id = request.data.get('division_id')

            if not player_ids:
                return Response({'detail': 'No players provided'}, status=status.HTTP_400_BAD_REQUEST)

            draft = Draft.objects.get(id=draft_id)
            team = Team.objects.get(id=team_id)
            division = Division.objects.get(id=division_id)

            deleted = []
            failures = []

            with transaction.atomic():
                for pid in player_ids:
                    try:
                        selection = DraftSelection.objects.get(
                            draft=draft, team=team, division=division, player_id=pid
                        )
                        selection.delete()
                        deleted.append(pid)
                    except DraftSelection.DoesNotExist:
                        failures.append(f'Player id {pid} not assigned to this team/division in draft')

            return Response({'deleted_player_ids': deleted, 'failures': failures}, status=status.HTTP_200_OK)

        except Exception as e:
            traceback.print_exc()
            return Response({'detail': str(e), 'type': type(e).__name__}, status=500)


@method_decorator(csrf_exempt, name='dispatch')
class DraftTeamStatsView(APIView):

    def get(self, request, draft_id):
        try:
            draft = Draft.objects.get(id=draft_id)
            teams = Team.objects.all()
            stats = []

            for team in teams:
                selections = DraftSelection.objects.filter(draft=draft, team=team)
                pitchers = 0
                catchers = 0
                for sel in selections:
                    try:
                        eval_obj = sel.player.evaluations.filter(season_year=draft.year).first()
                        if eval_obj:
                            if getattr(eval_obj, 'total_pitching', 0) > 0:
                                pitchers += 1
                            if getattr(eval_obj, 'total_catcher', 0) > 0:
                                catchers += 1
                    except Exception as e:
                        print(f"Error accessing evaluation for player {sel.player.id}: {e}")

                stats.append({
                    'team_id': team.id,
                    'team_name': team.name,
                    'pitchers': pitchers,
                    'catchers': catchers,
                })

            return Response(stats)
        except Exception as e:
            traceback.print_exc()
            return Response({'detail': str(e), 'type': type(e).__name__}, status=500)


@method_decorator(csrf_exempt, name='dispatch')
class DraftStateView(APIView):

    def get(self, request, draft_id):
        try:
            draft = Draft.objects.get(id=draft_id)
            current_year = draft.year

            selections = DraftSelection.objects.filter(draft=draft).select_related(
                'player', 'player__division', 'team', 'division'
            )

            # Build selections grouped by team with full player data
            selections_by_team: dict = {}
            for sel in selections:
                team_id = str(sel.team_id)
                if team_id not in selections_by_team:
                    selections_by_team[team_id] = []
                player = sel.player
                evaluation = player.evaluations.filter(season_year=current_year).first()
                selections_by_team[team_id].append({
                    'id': player.id,
                    'name': f"{player.first_name} {player.last_name}",
                    'team_id': sel.team_id,
                    'division_id': sel.division_id,
                    'tier_spot': getattr(evaluation, 'tier_spot', None) if evaluation else None,
                    'pitcher_tier': getattr(player, 'pitcher_tier', None),
                    'catcher_tier': getattr(player, 'catcher_tier', None),
                    'total_pitching': getattr(evaluation, 'total_pitching', None) if evaluation else None,
                    'total_catcher': getattr(evaluation, 'total_catcher', None) if evaluation else None,
                    'total_hitting': getattr(evaluation, 'total_hitting', None) if evaluation else None,
                    'total_fielding': getattr(evaluation, 'total_fielding', None) if evaluation else None,
                    'total_throwing': getattr(evaluation, 'total_throwing', None) if evaluation else None,
                    'overall_total': getattr(evaluation, 'overall_total', None) if evaluation else None,
                    'is_pitcher': bool(getattr(evaluation, 'total_pitching', 0) or 0),
                    'is_catcher': bool(getattr(evaluation, 'total_catcher', 0) or 0),
                })

            # Saved selected teams from M2M
            selected_team_ids = list(draft.selected_teams.values_list('id', flat=True))
            selected_teams_data = [
                {'id': t.id, 'name': t.name, 'coach': t.coach or '', 'assistant coach': t.assistant_coach or ''}
                for t in draft.selected_teams.all()
            ]

            return Response({
                'draft': {
                    'id': draft.id,
                    'name': draft.name,
                    'year': draft.year,
                    'is_complete': draft.is_complete,
                    'division_id': draft.division_id,
                    'created_at': draft.created_at,
                },
                'selected_team_ids': selected_team_ids,
                'selected_teams': selected_teams_data,
                'selections_by_team': selections_by_team,
            })

        except Draft.DoesNotExist:
            return Response({'detail': 'Draft not found'}, status=404)
        except Exception as e:
            traceback.print_exc()
            return Response({'detail': str(e), 'type': type(e).__name__}, status=500)


@method_decorator(csrf_exempt, name='dispatch')
class SaveDraftTeamsView(APIView):

    def post(self, request, draft_id):
        try:
            draft = Draft.objects.get(id=draft_id)
            team_ids = request.data.get('team_ids', [])
            draft.selected_teams.set(team_ids)
            return Response({'saved': team_ids}, status=status.HTTP_200_OK)
        except Draft.DoesNotExist:
            return Response({'detail': 'Draft not found'}, status=404)
        except Exception as e:
            traceback.print_exc()
            return Response({'detail': str(e), 'type': type(e).__name__}, status=500)


@method_decorator(csrf_exempt, name='dispatch')
class MarkDraftCompleteView(APIView):

    def post(self, request, draft_id):
        try:
            draft = Draft.objects.get(id=draft_id)
            draft.is_complete = True
            draft.save()
            return Response(
                {'id': draft.id, 'is_complete': draft.is_complete},
                status=status.HTTP_200_OK
            )
        except Draft.DoesNotExist:
            return Response({'detail': 'Draft not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            traceback.print_exc()
            return Response({'detail': str(e)}, status=500)