import csv
from datetime import datetime
from django.http import HttpResponse
from rest_framework.views import APIView
from league.models.evaluations import Evaluation
from league.models.players import Player


class ExportEvaluationsCSV(APIView):
    """
    Exports player evaluations with rankings to CSV
    Includes players without evaluations
    """

    def get(self, request):

        current_year = datetime.now().year
        division_id = request.query_params.get("division")

        players = Player.objects.all()

        if division_id:
            players = players.filter(division_id=division_id)

        evaluations = Evaluation.objects.filter(
            season_year=current_year,
            player__in=players
        ).select_related("player")

        # Create lookup of evaluations by player_id
        eval_map = {e.player_id: e for e in evaluations}

        eval_list = []

        for player in players:

            e = eval_map.get(player.id)

            if e:
                total_pitching = e.total_pitching or 0
                total_catcher = e.total_catcher or 0
                overall_total = (
                    (e.total_hitting or 0)
                    + (e.total_fielding or 0)
                    + (e.total_throwing or 0)
                )
            else:
                total_pitching = ""
                total_catcher = ""
                overall_total = ""

            eval_list.append((player, e, overall_total, total_pitching, total_catcher))

        # Sort players with evaluations by score
        eval_list.sort(key=lambda x: x[2] if x[2] != "" else -1, reverse=True)

        response = HttpResponse(content_type="text/csv")
        response["Content-Disposition"] = f'attachment; filename="evaluations_{current_year}.csv"'

        writer = csv.writer(response)

        writer.writerow([
            "First Name",
            "Last Name",
            "Teammate Request",
            "Coach Request",
            "Overall",
            "Pitch Total",
            "Catcher Total",
            "Rank",
            "Pitcher",
            "Catcher",
            "Tier",
            "Pitcher Tier",
            "Catcher Tier",
        ])

        rank = 1

        for player, e, overall_total, total_pitching, total_catcher in eval_list:

            if e:
                pitcher = "Yes" if total_pitching > 0 else "No"
                catcher = "Yes" if total_catcher > 0 else "No"
                tier = e.tier_spot or ""
                rank_value = rank
                rank += 1
            else:
                pitcher = ""
                catcher = ""
                tier = ""
                rank_value = ""

            writer.writerow([
                player.first_name,
                player.last_name,
                getattr(player, "teammate_request", ""),
                getattr(player, "coach_request", ""),
                overall_total,
                total_pitching,
                total_catcher,
                rank_value,
                pitcher,
                catcher,
                tier,
                getattr(player, "pitcher_tier", ""),
                getattr(player, "catcher_tier", ""),
            ])

        return response