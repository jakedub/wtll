# league/views/kml.py
from rest_framework.views import APIView
from rest_framework.response import Response
from django.http import FileResponse, Http404
from django.conf import settings
import os
from league.utils.district import parse_kml

class KMLCoordinatesView(APIView):
    def get(self, request, *args, **kwargs):
        kml_path = os.path.join(settings.BASE_DIR, "league", "static", "cleaned_8.kml")
        _, polygons = parse_kml(kml_path)
        return Response({'polygons': polygons})


class ServeKMLFileView(APIView):
    """
    Serve the KML file itself so that Google Maps KmlLayer can load it.
    """
    def get(self, request, *args, **kwargs):
        kml_path = os.path.join(settings.BASE_DIR, "league", "static", "cleaned_8.kml")
        if not os.path.exists(kml_path):
            raise Http404("KML file not found")
        return FileResponse(
            open(kml_path, "rb"),
            content_type="application/vnd.google-earth.kml+xml"
        )