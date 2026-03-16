from rest_framework.routers import DefaultRouter
from django.urls import path, include
from league.views.players import PlayerViewSet, PlayerWithoutEvaluationsView
from league.views.teams import TeamViewSet
from league.views.divisions import DivisionViewSet
from league.views.evaluations import EvaluationViewSet, EvaluationListViewByDivision
from league.views.uploads import CheckCsvDistrictView
from league.views.kml import KMLCoordinatesView, ServeKMLFileView
from league.views.positions import PositionViewSet 
from league.views.fielding import assign_random_fielding
from league.views.draft import DraftViewSet, DraftPlayerView, DraftTeamStatsView, AvailablePlayersView, DraftStateView
from league.views.teams import TeamsByDivisionView
from league.views.evaluation_uploads import UploadEvaluationCSVView
from league.views.export_evaluations_csv import ExportEvaluationsCSV



router = DefaultRouter()
router.register(r'players', PlayerViewSet)
router.register(r'teams', TeamViewSet)
router.register(r'positions', PositionViewSet)
router.register(r'divisions', DivisionViewSet)
router.register(r'evaluations', EvaluationViewSet)
router.register(r'draft', DraftViewSet, basename='draft')
urlpatterns = [
    path('', include(router.urls)),
        # Draft endpoints
    path('draft/<int:draft_id>/players/', DraftPlayerView.as_view(), name='draft-player'),
    path('draft/<int:draft_id>/team-stats/', DraftTeamStatsView.as_view(), name='draft-team-stats'),
    path('draft/<int:draft_id>/available-players/', AvailablePlayersView.as_view(), name='draft-available-players'),
    path('draft/<int:draft_id>/state/', DraftStateView.as_view(), name='draft-state'),
    path('teams/by-division/<int:division_id>/', TeamsByDivisionView.as_view(), name='teams-by-division'),
        # Upload and district CSV endpoints
    path('check-csv-district/', CheckCsvDistrictView.as_view(), name='check_csv_district'),
    path('evaluations-upload/', UploadEvaluationCSVView.as_view(), name='upload_evaluation_csv'),
        # KML coordinates endpoint
    path('kml-coordinates/', KMLCoordinatesView.as_view(), name='kml_coordinates'),
    path('serve-kml/', ServeKMLFileView.as_view(), name='serve_kml'),
        # Fielding endpoint
    path('fielding/assign-random/', assign_random_fielding, name='assign_random_fielding'),
        # Players without evaluations
    path('players/no-evaluations/', PlayerWithoutEvaluationsView.as_view(), name='players_without_evaluations'),
        # Evaluation by division endpoint
    path('evaluations/division/<int:division_id>/', EvaluationListViewByDivision.as_view(), name='evaluations-by-division'),
    path('export-evaluations-csv/', ExportEvaluationsCSV.as_view(), name='export-evaluations-csv')
]