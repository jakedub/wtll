# league/services/reporting.py
from league.models.players import Player


def players_without_evaluations():
    """
    Players who are in-district but have no evaluations.
    """
    return Player.objects.filter(
        in_district=True,
        evaluations__isnull=True
    ).distinct()


def out_of_district_players():
    """
    Players flagged as out of district.
    """
    return Player.objects.filter(in_district=False)


def generate_reports():
    """
    Aggregate reporting data for admin / API usage.
    """
    total_players = Player.objects.count()

    return {
        "total_players": total_players,
        "players_without_evaluations": players_without_evaluations(),
        "out_of_district_players": out_of_district_players(),
        "players_by_district": {}
    }