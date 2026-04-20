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
from league.views.draft import DraftViewSet, DraftPlayerView, DraftTeamStatsView, AvailablePlayersView, DraftStateView, MarkDraftCompleteView, SaveDraftTeamsView
from league.views.teams import TeamsByDivisionView
from league.views.evaluation_uploads import UploadEvaluationCSVView
from league.views.export_evaluations_csv import ExportEvaluationsCSV
from league.views.team_balance import TeamBalanceAPIView
from league.views.draft_export import ExportDraftResultsCSV
from league.views.export_jersey_rosters import ExportJerseyRoster



router = DefaultRouter()
router.register(r'players', PlayerViewSet)
router.register(r'teams', TeamViewSet)
router.register(r'positions', PositionViewSet)
router.register(r'divisions', DivisionViewSet)
router.register(r'evaluations', EvaluationViewSet)
router.register(r'draft', DraftViewSet, basename='draft')
urlpatterns = [
    
        # Draft endpoints
    path('draft/<int:draft_id>/players/', DraftPlayerView.as_view(), name='draft-player'),
    path('draft/<int:draft_id>/team-stats/', DraftTeamStatsView.as_view(), name='draft-team-stats'),
    path('draft/<int:draft_id>/available-players/', AvailablePlayersView.as_view(), name='draft-available-players'),
    path('draft/<int:draft_id>/state/', DraftStateView.as_view(), name='draft-state'),
    path('draft/<int:draft_id>/complete/', MarkDraftCompleteView.as_view(), name='draft-complete'),
    path('draft/<int:draft_id>/save-teams/', SaveDraftTeamsView.as_view(), name='draft-save-teams'),
    path('teams/by-division/<int:division_id>/', TeamsByDivisionView.as_view(), name='teams-by-division'),
    path('exports/jersey-roster/', ExportJerseyRoster.as_view(), name='export-jersey-roster'),
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
    path('export-evaluations-csv/', ExportEvaluationsCSV.as_view(), name='export-evaluations-csv'),
    path('division/<int:division_id>/team-balance/', TeamBalanceAPIView.as_view(), name='team-balance'),
    path('draft/<int:draft_id>/export/', ExportDraftResultsCSV.as_view(), name='export-draft-results'),
    path('', include(router.urls))
]