from django.core.management.base import BaseCommand
from league.models import Player, Division, Team
import random
import datetime

class Command(BaseCommand):
    help = 'Create test data for divisions, teams, and players'

    def handle(self, *args, **options):
        # Create Divisions
        majors, _ = Division.objects.get_or_create(name='majors')
        aaa_minor, _ = Division.objects.get_or_create(name='aaa_minor')
        aa_minor, _ = Division.objects.get_or_create(name='aa_minor')

        self.stdout.write(self.style.SUCCESS('Divisions created or retrieved successfully'))

        # Create Teams
        nl_central_teams = ['Cardinals', 'Cubs', 'Reds', 'Brewers', 'Pirates']
        divisions = [
            (aa_minor, 'AA Minor'),
            (aaa_minor, 'AAA Minor'),
            (majors, 'Majors')
        ]

        coach_names = {
            'Cardinals': {
                'aa_minor': 'Coach AA Cardinals',
                'aaa_minor': 'Coach AAA Cardinals',
                'majors': 'Coach Majors Cardinals'
            },
            'Cubs': {
                'aa_minor': 'Coach AA Cubs',
                'aaa_minor': 'Coach AAA Cubs',
                'majors': 'Coach Majors Cubs'
            },
            'Reds': {
                'aa_minor': 'Coach AA Reds',
                'aaa_minor': 'Coach AAA Reds',
                'majors': 'Coach Majors Reds'
            },
            'Brewers': {
                'aa_minor': 'Coach AA Brewers',
                'aaa_minor': 'Coach AAA Brewers',
                'majors': 'Coach Majors Brewers'
            },
            'Pirates': {
                'aa_minor': 'Coach AA Pirates',
                'aaa_minor': 'Coach AAA Pirates',
                'majors': 'Coach Majors Pirates'
            }
        }

        teams = []
        for division_obj, division_name in divisions:
            for team_name in nl_central_teams:
                coach = coach_names[team_name][division_obj.name]
                team, _ = Team.objects.get_or_create(
                    name=team_name,
                    coach=coach,
                    year=2025,
                    division=division_obj
                )
                teams.append(team)

        self.stdout.write(self.style.SUCCESS('Teams created successfully'))

        # Create Players
        players = []
        batting_throwing_options = ['Left', 'Right', 'Switch']
        for team in teams:
            if team.division == majors:
                player_count_range = range(10, 13)
            elif team.division == aaa_minor:
                player_count_range = range(8, 10)
            else:
                player_count_range = range(6, 8)

            for i in player_count_range:
                year = random.randint(2010, 2015)
                month = random.randint(1, 12)
                if month == 2:
                    day = random.randint(1, 28)
                elif month in [4, 6, 9, 11]:
                    day = random.randint(1, 30)
                else:
                    day = random.randint(1, 31)
                date_of_birth = datetime.date(year, month, day)

                street_number = random.randint(100, 9999)
                street_names = ['Maple', 'Oak', 'Pine', 'Cedar', 'Elm', 'Washington', 'Lincoln', 'Jefferson', 'Adams', 'Madison']
                street_types = ['St', 'Ave', 'Blvd', 'Ln', 'Rd', 'Dr', 'Ct']
                street_name = random.choice(street_names)
                street_type = random.choice(street_types)
                zip_codes = ['46231', '46234', '46239', '46241']
                zip_code = random.choice(zip_codes)
                address_line_1 = f"{street_number} {street_name} {street_type}"

                # 50% chance to have address_line_2
                if random.choice([True, False]):
                    address_line_2 = f"Apt {random.randint(1, 999)}"
                else:
                    address_line_2 = ''

                batting_hand = random.choice(batting_throwing_options)
                throwing_hand = random.choice(batting_throwing_options)

                player, _ = Player.objects.get_or_create(
                    first_name=f'Player{i}',
                    last_name=f'{team.name}',
                    email=f'player{i}_{team.name.lower()}@test.com',  # ensure unique email
                    division=team.division,
                    team=team,
                    sport='baseball',
                    program='spring',
                    state='IN',
                    city='Indianapolis',
                    zip_code=zip_code,
                    date_of_birth=date_of_birth,
                    address_line_1=address_line_1,
                    address_line_2=address_line_2,
                    batting_hand=batting_hand,
                    throwing_hand=throwing_hand
                )
                players.append(player)

        self.stdout.write(self.style.SUCCESS('Test players created successfully'))

        from league.models import Position
        all_positions = list(Position.objects.all())

        # Create Evaluations for each player
        from league.models import Evaluation
        for player in players:
            is_pitcher = random.choice([True, False])
            is_catcher = random.choice([True, False])

            random_positions = random.sample(all_positions, 2)
            for pos in random_positions:
                player.positions.add(pos)

            if is_pitcher:
                position_p, _ = Position.objects.get_or_create(code='P')
                player.positions.add(position_p)
            if is_catcher:
                position_c, _ = Position.objects.get_or_create(code='C')
                player.positions.add(position_c)
            player.save()
            for evaluation_type in ['pre', 'post']:
                Evaluation.objects.get_or_create(
                    player=player,
                    season_year=2025,
                    evaluation_type=evaluation_type,
                    defaults={
                        'hitting_form': random.randint(1, 5),
                        'hitting_power': random.randint(1, 5),
                        'hitting_contact': random.randint(1, 5),
                        'fielding_form': random.randint(1, 5),
                        'fielding_glove': random.randint(1, 5),
                        'fielding_hustle': random.randint(1, 5),
                        'throwing_form': random.randint(1, 5),
                        'throwing_speed': random.randint(1, 5),
                        'throwing_accuracy': random.randint(1, 5),
                        'pitching_speed': random.randint(1, 5) if is_pitcher else 0,
                        'pitching_accuracy': random.randint(1, 5) if is_pitcher else 0,
                        'catcher_receiving': random.randint(1, 5) if is_catcher else 0,
                        'catcher_blocking': random.randint(1, 5) if is_catcher else 0,
                        'catcher_throwing': random.randint(1, 5) if is_catcher else 0,
                        'general_ability': random.randint(1, 5),
                    }
                )

        self.stdout.write(self.style.SUCCESS('Evaluations created successfully'))