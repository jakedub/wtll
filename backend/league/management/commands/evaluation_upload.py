import csv
from django.core.management.base import BaseCommand
from django.db import transaction
from league.models.players import Player
from league.models.evaluations import Evaluation

class Command(BaseCommand):
    help = 'Populate evaluations from CSV file'

    def add_arguments(self, parser):
        parser.add_argument('csv_file', type=str, help='Path to the CSV file')

    def handle(self, *args, **options):
        csv_file = options['csv_file']
        failures = []

        try:
            with open(csv_file, newline='', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                processed_players = set()

                for row in reader:
                    full_name = row.get('Player', '').strip()
                    if not full_name or full_name in processed_players:
                        continue
                    processed_players.add(full_name)

                    # Split into first and last
                    parts = full_name.split()
                    if len(parts) < 2:
                        failures.append(f"Row {reader.line_num}: Player name '{full_name}' invalid")
                        continue
                    first_name = parts[0]
                    last_name = " ".join(parts[1:])

                    try:
                        player = Player.objects.get(first_name__iexact=first_name, last_name__iexact=last_name)
                    except Player.DoesNotExist:
                        failures.append(f"Row {reader.line_num}: Player '{full_name}' not found in database")
                        continue
                    except Player.MultipleObjectsReturned:
                        failures.append(f"Row {reader.line_num}: Multiple players found for '{full_name}'")
                        continue

                    try:
                        with transaction.atomic():
                            evaluation = Evaluation(
                                player=player,
                                season_year=row.get('Season Year') or 2026,
                                evaluation_type='pre',
                                hitting_form=self._parse_int(row.get('Hitting Form')),
                                hitting_power=self._parse_int(row.get('Hitting Power')),
                                hitting_contact=self._parse_int(row.get('Hitting Contact')),
                                fielding_form=self._parse_int(row.get('Fielding Form')),
                                fielding_glove=self._parse_int(row.get('Fielding Glove')),
                                fielding_hustle=self._parse_int(row.get('Fielding Hustle')),
                                throwing_form=self._parse_int(row.get('Throwing Form')),
                                throwing_speed=self._parse_int(row.get('Throwing Speed')),
                                throwing_accuracy=self._parse_int(row.get('Throwing Accuracy')),
                                pitching_speed=self._parse_int(row.get('Pitching Speed')),
                                pitching_accuracy=self._parse_int(row.get('Pitching Accuracy')),
                                catcher_receiving=self._parse_int(row.get('Catcher Receiving')),
                                catcher_blocking=self._parse_int(row.get('Catcher Blocking')),
                            )

                            # Map batting hand from CSV if present, otherwise fallback to player profile
                            csv_batting_hand = row.get('Batting Hand', '').strip().upper()
                            if csv_batting_hand in ['L', 'R', 'B']:
                                evaluation.batting_hand = csv_batting_hand
                            elif hasattr(player, 'batting_hand'):
                                evaluation.batting_hand = player.batting_hand

                            csv_throwing_hand = row.get('Throwing Hand', '').strip().upper()
                            if csv_throwing_hand in ['L', 'R']:
                                evaluation.throwing_hand = csv_throwing_hand
                            elif hasattr(player, 'throwing_hand'):
                                evaluation.throwing_hand = player.throwing_hand

                            try:
                                evaluation.save()
                            except Exception as e:
                                if 'unique constraint' not in str(e).lower():
                                    failures.append(f"Row {reader.line_num}: Failed to save evaluation for '{full_name}' - {e}")

                    except Exception as e:
                        failures.append(f"Row {reader.line_num}: Failed to save evaluation for '{full_name}' - {e}")

                if failures:
                    for f in failures:
                        self.stdout.write(f"- {f}")

        except FileNotFoundError:
            self.stderr.write(self.style.ERROR(f"CSV file '{csv_file}' not found"))
        except Exception as e:
            self.stderr.write(self.style.ERROR(f"Error processing CSV: {e}"))

    @staticmethod
    def _parse_int(value):
        try:
            return int(value)
        except (TypeError, ValueError):
            return None