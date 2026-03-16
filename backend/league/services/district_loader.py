# league/services/district_loader.py
import os
import geopandas as gpd
from django.conf import settings

_POLYGONS_CACHE = None

def load_district_polygons():
    global _POLYGONS_CACHE
    if _POLYGONS_CACHE is not None:
        return _POLYGONS_CACHE

    kml_path = os.path.join(settings.BASE_DIR, 'league', 'static', 'District8.kml')
    if not os.path.exists(kml_path):
        raise FileNotFoundError(f"KML not found at {kml_path}")

    gdf = gpd.read_file(kml_path, driver='KML', layer=0)

    polygons = []
    for geom in gdf.geometry:
        if geom.geom_type == 'Polygon':
            polygons.append(list(geom.exterior.coords))
        elif geom.geom_type == 'MultiPolygon':
            for poly in geom.geoms:
                polygons.append(list(poly.exterior.coords))

    _POLYGONS_CACHE = polygons
    return polygons