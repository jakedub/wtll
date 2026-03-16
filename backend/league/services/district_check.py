from shapely.geometry import Point, Polygon

from league.models.players import Player

def is_point_in_district(lat, lng, polygons):
    """
    Determines if a single point (latitude, longitude) is within any of the given polygons.

    Args:
        lat (float): Latitude of the point.
        lng (float): Longitude of the point.
        polygons (list): A list of polygons, where each polygon is a list of (lng, lat) coordinate tuples.

    Returns:
        bool: True if the point is inside any polygon, False otherwise.
    """
    if lat is None or lng is None:
        return False

    point = Point(lng, lat)  # (x, y)
    for coords in polygons:
        try:
            polygon = Polygon(coords)
            if polygon.contains(point):
                return True
        except Exception:
            continue

    return False

def check_address_in_district(lat, lng, polygons):
    """
    Wrapper function to check if a single address (latitude, longitude) is within district polygons.

    Args:
        lat (float): Latitude of the address.
        lng (float): Longitude of the address.
        polygons (list): A list of polygons.

    Returns:
        bool: True if the address is inside any polygon, False otherwise.
    """
    return is_point_in_district(lat, lng, polygons)

def check_all_players_in_district(polygons):
    """
    Checks all players with latitude and longitude, updates their in_district flag,
    and returns a list of players who are out of district.

    Args:
        polygons (list): A list of polygons representing the district boundaries.

    Returns:
        list: List of Player objects who are outside the district.
    """
    outliers = []
    players = Player.objects.exclude(latitude__isnull=True).exclude(longitude__isnull=True)
    for player in players:
        try:
            in_dist = is_point_in_district(player.latitude, player.longitude, polygons)
            player.in_district = in_dist
            player.save()
            if not in_dist:
                outliers.append(player)
        except Exception:
            # If any error occurs, consider player as outlier and continue
            player.in_district = False
            player.save()
            outliers.append(player)

    return outliers