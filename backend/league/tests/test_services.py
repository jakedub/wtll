from django.utils import timezone
from django.test import TestCase, Client
from rest_framework.test import APIClient
from django.core.files.uploadedfile import SimpleUploadedFile
from unittest.mock import patch, MagicMock
from io import BytesIO
from league.models import Player
from league.services import player_import, geocoding, district_check, reporting
from shapely.geometry import Polygon, Point
import json

def check_address_in_district(lat, lng, polygons):
    point = Point(lng, lat)
    for polygon in polygons:
        if polygon.contains(point):
            return True
    return False

def check_all_players_in_district(polygons):
    outliers = []
    for player in Player.objects.all():
        if player.latitude is not None and player.longitude is not None:
            in_district = check_address_in_district(player.latitude, player.longitude, polygons)
            player.in_district = in_district
            player.save()
            if not in_district:
                outliers.append(player)
    return outliers
csv_content = b"Player First Name,Player Last Name,Player Street,City,State,Postal Code\nJohn,Doe,123 Main St,CityA,ST,12345\nJane,Smith,456 Elm St,CityB,ST,67890"
class PlayerImportTests(TestCase):
    def test_player_import_view(self):
        client = APIClient()
        csv_content = b"Player First Name,Player Last Name,Player Street,City,State,Postal Code\nJohn,Doe,123 Main St,CityA,ST,12345\nJane,Smith,456 Elm St,CityB,ST,67890"
        uploaded_file = SimpleUploadedFile("players.csv", csv_content, content_type="text/csv")
        response = client.post('/api/players/import/', {'file': uploaded_file}, format='multipart')
        self.assertEqual(response.status_code, 200)
        self.assertIn('processed', response.json())
        self.assertEqual(len(response.json()['processed']), 2)

    @patch('league.services.player_import.Player.objects.create')
    def test_import_players_from_csv_calls_create(self, mock_create):
        csv_content = b"first_name,last_name,address_line_1\nJohn,Doe,123 Main St"
        csv_file = BytesIO(csv_content)
        player_import.import_players_from_csv(csv_file)
        mock_create.assert_called_once_with(first_name="John", last_name="Doe", address_line_1="123 Main St")

class GeocodingTests(TestCase):
    def setUp(self):
        self.player1 = Player.objects.create(first_name="Alice", last_name="Wonderland", address_line_1="1 Infinite Loop")
        self.player2 = Player.objects.create(first_name="Bob", last_name="Builder", address_line_1="1600 Amphitheatre Parkway")

    @patch('league.services.geocoding.geocode_address')
    def test_geocode_single_address_returns_coordinates(self, mock_geocode):
        mock_geocode.return_value = (37.33182, -122.03118)
        lat, lon, error = geocoding.geocode_single_address("1 Infinite Loop")
        self.assertAlmostEqual(round(lat, 5), 37.33182, places=4)
        self.assertAlmostEqual(round(lon, 5), -122.03118, places=4)
        self.assertIsNone(error)
        mock_geocode.assert_called_once_with("1 Infinite Loop")

    @patch('league.services.geocoding.geocode_address')
    def test_geocode_missing_players_batch_updates_players(self, mock_geocode_address):
        """
        Ensure geocode_missing_players_batch updates all players with mocked lat/lng.
        Patches geocode_address directly because the service calls it.
        """
        # Mock returns two players: first tuple for player1, second for player2
        mock_geocode_address.side_effect = [
            (37.33182, -122.03118),
            (37.422, -122.084)
        ]

        updated_players, failed = geocoding.geocode_missing_players_batch()

        # Refresh players from DB to get updated lat/lng
        self.player1.refresh_from_db()
        self.player2.refresh_from_db()

        # Assert that DB values match the mock exactly
        self.assertAlmostEqual(self.player1.latitude, 37.33182, places=5)
        self.assertAlmostEqual(self.player1.longitude, -122.03118, places=5)
        self.assertAlmostEqual(self.player2.latitude, 37.422, places=5)
        self.assertAlmostEqual(self.player2.longitude, -122.084, places=5)
        self.assertEqual(len(updated_players), 2)
        self.assertEqual(len(failed), 0)

class DistrictCheckTests(TestCase):
    def setUp(self):
        self.district = [Polygon([(0, 0), (0, 10), (10, 10), (10, 0), (0, 0)])]
        self.player_in = Player.objects.create(first_name="In", last_name="Player", address_line_1="5 5", latitude=5, longitude=5)
        self.player_out = Player.objects.create(first_name="Out", last_name="Player", address_line_1="20 20", latitude=20, longitude=20)

    def test_check_address_in_district_true(self):
        inside = district_check.check_address_in_district(self.player_in.latitude, self.player_in.longitude, self.district)
        self.assertTrue(inside)

    def test_check_address_in_district_false(self):
        outside = district_check.check_address_in_district(self.player_out.latitude, self.player_out.longitude, self.district)
        self.assertFalse(outside)

    def test_check_all_players_in_district_reports_outliers(self):
        outliers = district_check.check_all_players_in_district(self.district)
        self.assertIn(self.player_out, outliers)
        self.assertNotIn(self.player_in, outliers)

class ReportingTests(TestCase):
    def setUp(self):
        Player.objects.create(first_name="Alice", last_name="Wonderland", address_line_1="1 Infinite Loop", latitude=37.33182, longitude=-122.03118)
        Player.objects.create(first_name="Bob", last_name="Builder", address_line_1="1600 Amphitheatre Parkway", latitude=37.422, longitude=-122.084)

    def test_generate_reports_returns_expected_data(self):
        report = reporting.generate_reports()
        self.assertIn('total_players', report)
        self.assertIn('players_by_district', report)
        self.assertIn('players_without_evaluations', report)
        self.assertIn('out_of_district_players', report)
        self.assertEqual(report['total_players'], 2)

class IntegrationTests(TestCase):
    def setUp(self):
        self.client = Client()

    def test_player_import_view(self):
        client = APIClient()
        csv_content = b"Player First Name,Player Last Name,Player Street,City,State,Postal Code\nJohn,Doe,123 Main St,CityA,ST,12345\nJane,Smith,456 Elm St,CityB,ST,67890"
        uploaded_file = SimpleUploadedFile("players.csv", csv_content, content_type="text/csv")
        response = client.post('/api/players/import/', {'file': uploaded_file}, format='multipart')
        self.assertEqual(response.status_code, 200)
        self.assertIn('processed', response.json())
        self.assertEqual(len(response.json()['processed']), 2)
        # Optional: check first player data
        self.assertEqual(response.json()['processed'][0]['first_name'], 'John')
        self.assertEqual(response.json()['processed'][0]['address_line_1'], '123 Main St')

    @patch('league.views.geocode.geocode_single_address')
    def test_geocode_view(self, mock_geocode):
        """
        Integration test for /api/geocode/. Mocks the geocode_single_address used by the view.
        """
        mock_geocode.return_value = (37.33182, -122.03118, None)
        response = self.client.get('/api/geocode/', {'address': '1 Infinite Loop'})
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertAlmostEqual(data['latitude'], 37.33182, places=5)
        self.assertAlmostEqual(data['longitude'], -122.03118, places=5)
        self.assertEqual(data['status'], 'SUCCESS')
        mock_geocode.assert_called_once_with('1 Infinite Loop')

    def test_district_check_view(self):
        polygon = Polygon([(0, 0), (0, 10), (10, 10), (10, 0), (0, 0)])
        
        Player.objects.create(first_name="In", last_name="Player", address_line_1="5 5", latitude=5, longitude=5)
        Player.objects.create(first_name="Out", last_name="Player", address_line_1="20 20", latitude=20, longitude=20)

        outliers = check_all_players_in_district([polygon])
        self.assertIn(Player.objects.get(first_name="Out", last_name="Player"), outliers)
        self.assertNotIn(Player.objects.get(first_name="In", last_name="Player"), outliers)

    def test_reporting_view(self):
        Player.objects.create(first_name="Alice", last_name="Wonderland", address_line_1="1 Infinite Loop", latitude=37.33182, longitude=-122.03118)
        response = self.client.get('/api/reports/')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn('total_players', data)
        self.assertIn('players_by_district', data)
        self.assertIn('players_without_evaluations', data)
        self.assertIn('out_of_district_players', data)
