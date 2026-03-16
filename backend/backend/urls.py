from django.contrib import admin
from django.urls import path, include, re_path
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi

from league.views.geocode import GeocodeView
from league.views.geocode_batch import GeocodeMissingPlayersView
from league.views.uploads import UploadCSVPlayersView
from league.views.player_uploads import UploadPlayersView
from league.views.district import CheckPlayersInDistrictView
from backend.views import generate_reports_view
from league.views.division_count import division_counts
from league.views.players import CheckPlayerEligibilityView


schema_view = get_schema_view(
    openapi.Info(
        title="WTLL API",
        default_version='v1',
        description="Washington Township Little League API documentation",
    ),
    public=True,
    permission_classes=(permissions.AllowAny,),
)

urlpatterns = [
    # Admin panel
    path('admin/', admin.site.urls),
    path('api/players/upload_csv/', UploadCSVPlayersView.as_view(), name='upload_csv_players'),
    path('api/players/import/', UploadPlayersView.as_view(), name='import_players'),
    path('api/check-in-district/', CheckPlayersInDistrictView.as_view(), name='check_in_district'),
    path('api/division-counts/', division_counts, name='division_counts'),
    path('api/check-player-eligibility/', CheckPlayerEligibilityView.as_view(), name='check_player_eligibility'),
    # League app routes (players, teams, divisions, etc.)
    path('api/', include('league.urls')),

    # Geocoding & district job endpoints
    path('api/geocode/', GeocodeView.as_view(), name='geocode'),
    path('api/geocode-missing-players/', GeocodeMissingPlayersView.as_view(), name='geocode_missing_players'),

    # Reporting endpoint
    path('api/reports/', generate_reports_view, name='generate_reports'),

    # Player CSV upload
    

    # API documentation
    re_path(r'^docs/$', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    re_path(r'^redoc/$', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
]