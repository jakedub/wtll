from shapely.geometry import Polygon, Point, MultiPolygon
import geopandas as gpd
import os
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

def parse_kml(file_path: str):
    """
    Parse a KML file using GeoPandas.
    Returns:
        coordinates: list of {'lat': float, 'lng': float} for points
        polygons: list of lists of {'lat', 'lng'} for polygon vertices
    """
    if not os.path.exists(file_path):
        logger.error(f"KML file not found: {file_path}")
        return [], []

    try:
        gdf = gpd.read_file(file_path)

        # Ensure projection is lat/lng
        if gdf.crs is not None and gdf.crs.to_string() != "EPSG:4326":
            gdf = gdf.to_crs(epsg=4326)

        coordinates = []
        polygons = []

        for geom in gdf.geometry:
            if geom.geom_type == 'Point':
                coordinates.append({'lat': geom.y, 'lng': geom.x})
            elif geom.geom_type == 'Polygon':
                # Ignore any extra dimensions
                poly_coords = [{'lat': coord[1], 'lng': coord[0]} for coord in geom.exterior.coords]
                polygons.append(poly_coords)
            elif geom.geom_type == 'MultiPolygon':
                for subpoly in geom.geoms:
                    poly_coords = [{'lat': coord[1], 'lng': coord[0]} for coord in subpoly.exterior.coords]
                    polygons.append(poly_coords)
            else:
                logger.warning(f"Unsupported geometry type: {geom.geom_type}")

        return coordinates, polygons

    except Exception as e:
        logger.exception(f"Error parsing KML: {e}")
        return [], []
    """
    Parse a KML file using GeoPandas.
    Returns:
        coordinates: list of {'lat': float, 'lng': float} for points
        polygons: list of lists of {'lat', 'lng'} for polygon vertices
    """
    if not os.path.exists(file_path):
        logger.error(f"KML file not found: {file_path}")
        return [], []

    try:
        gdf = gpd.read_file(file_path)

        # Ensure projection is lat/lng
        if gdf.crs is not None and gdf.crs.to_string() != "EPSG:4326":
            gdf = gdf.to_crs(epsg=4326)
            logger.info(f"Reprojected KML to EPSG:4326 from {gdf.crs}")

        coordinates = []
        polygons = []

        for geom in gdf.geometry:
            if geom.geom_type == 'Point':
                coordinates.append({'lat': geom.y, 'lng': geom.x})
            elif geom.geom_type == 'Polygon':
                poly_coords = [{'lat': y, 'lng': x} for x, y in geom.exterior.coords]
                polygons.append(poly_coords)
            elif geom.geom_type == 'MultiPolygon':
                for subpoly in geom.geoms:
                    poly_coords = [{'lat': y, 'lng': x} for x, y in subpoly.exterior.coords]
                    polygons.append(poly_coords)
            else:
                logger.warning(f"Unsupported geometry type: {geom.geom_type}")

        return coordinates, polygons

    except Exception as e:
        logger.exception(f"Error parsing KML: {e}")
        return [], []

def load_district_polygons() -> list[list[dict]]:
    """
    Load district polygons from the default KML file in league/static.
    Returns a list of polygon coordinate dicts [{'lat': ..., 'lng': ...}, ...]
    """
    kml_path = os.path.join(settings.BASE_DIR, 'league', 'static', 'District8.kml')
    _, polygons = parse_kml(kml_path)
    return polygons

def is_player_in_district(lat: float, lng: float, polygons: list[list[dict]]) -> bool:
    """
    Check if a given lat/lng point is inside any of the district polygons.
    Returns True if inside, False otherwise.
    """
    if lat is None or lng is None:
        return False

    player_point = Point(lng, lat)  # shapely uses (x, y) = (lng, lat)

    for poly in polygons:
        polygon_coords = [(p['lng'], p['lat']) for p in poly]
        shapely_poly = Polygon(polygon_coords)
        if shapely_poly.contains(player_point):
            return True

    return False

# Quick test
if __name__ == "__main__":
    # Replace with coordinates you know are inside the district
    test_lat, test_lng = 39.76942, -86.09218
    polygons = load_district_polygons()
    if polygons:
        inside = is_player_in_district(test_lat, test_lng, polygons)
        print(f"Test point ({test_lat}, {test_lng}) inside district? {inside}")
    else:
        print("No polygons loaded from KML.")


def determine_player_eligibility(player, polygons, eligible_schools):
    """
    Determine if a player is eligible based on:
    1. Already marked eligible
    2. In district
    3. School eligibility
    """

    player_name = f"{getattr(player, 'first_name', '')} {getattr(player, 'last_name', '')}"

    # Rule 1: already eligible
    if player.is_eligible:
        logger.info(f"[Eligibility] {player_name}: already marked eligible")
        return True

    # Rule 2: lives in district
    if player.in_district:
        logger.info(f"[Eligibility] {player_name}: eligible via district residency")
        return True
    # Rule 2b: automatic eligibility for certain divisions
    division_id = getattr(player, "division_id", None)
    if division_id is None and getattr(player, "division", None):
        division_id = getattr(player.division, "id", None)

    if division_id in [3, 4, 5]:
        logger.info(f"[Eligibility] {player_name}: eligible via division_id ({division_id})")
        return True

    # Rule 3: school eligibility
    school_name = getattr(player, "school_name", "")
    school_name = school_name.lower().strip()

    if not school_name:
        logger.info(f"[Eligibility] {player_name}: not eligible (no school provided)")
        return False

    eligible_schools_normalized = [s.lower().strip() for s in eligible_schools]

    for school in eligible_schools_normalized:
        if school in school_name:
            logger.info(f"[Eligibility] {player_name}: eligible via school match ({school_name})")
            return True

    logger.info(f"[Eligibility] {player_name}: not eligible (school '{school_name}' not in approved list)")
    return False