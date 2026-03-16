from django.db import models
from league.models.positions import Position
from league.services.tiers import calculate_overall_tier
from django.db.models import Max

PROGRAMS = [
    ('spring', 'Spring'),
    ('summer', 'Summer'),
    ('fall', 'Fall'),
    ('winter', 'Winter'),
]

SPORTS = [
    ('baseball', 'Baseball'),
    ('softball', 'Softball'),
]

HANDED_NESS = [
    ('right', 'Right'),
    ('left', 'Left'),
    ('switch', 'Switch'),
]


class Player(models.Model):
    # Basic player info
    first_name = models.CharField(max_length=50)
    last_name = models.CharField(max_length=50)
    email = models.EmailField(blank=True, null=True)
    date_of_birth = models.DateField(null=True, blank=True)

    # League + team data
    division = models.ForeignKey(
        'league.Division',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='players'
    )
    team = models.ForeignKey(
        'league.Team',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='players'
    )
    positions = models.ManyToManyField(Position, blank=True, related_name='players')

    # Program metadata
    program = models.CharField(max_length=30, blank=True, choices=PROGRAMS)
    sport = models.CharField(max_length=10, blank=True, choices=SPORTS, default='baseball')

    # Address information
    address_line_1 = models.CharField(max_length=100, blank=True)
    address_line_2 = models.CharField(max_length=100, blank=True)
    city = models.CharField(max_length=50, blank=True)
    state = models.CharField(max_length=50, blank=True)
    zip_code = models.CharField(max_length=20, blank=True)

    # Geocoding fields
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    in_district = models.BooleanField(null=True, blank=True, db_index=True)  # Indexed for faster queries
    district_checked_at = models.DateTimeField(null=True, blank=True)

    # Player evaluation metadata
    batting_hand = models.CharField(max_length=10, blank=True, choices=HANDED_NESS)
    throwing_hand = models.CharField(max_length=10, blank=True, choices=HANDED_NESS)
    is_allstar = models.BooleanField(default=False)
    is_showcase = models.BooleanField(default=False)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    teammate_request = models.CharField(max_length=255, blank=True)
    coach_request = models.CharField(max_length=255, blank=True)

    jersey_size = models.CharField(max_length=10, blank=True)

    residency_same = models.BooleanField(default=True)
    interested_showcase = models.BooleanField(default=False)
    is_eligible = models.BooleanField(default=False)
    school_name = models.CharField(max_length=255, blank=True)
    tier = models.CharField(max_length=10, blank=True)
    pitcher_tier = models.CharField(max_length=20, blank=True)
    catcher_tier = models.CharField(max_length=20, blank=True)


    class Meta:
        ordering = ['last_name', 'first_name']
        unique_together = ('first_name', 'last_name', 'date_of_birth', 'address_line_1')

    def __str__(self):
        return f"{self.first_name} {self.last_name}"

    @property
    def full_address(self):
        """Combine address fields for geocoding convenience."""
        parts = [
            self.address_line_1,
            self.address_line_2,
            self.city,
            self.state,
            self.zip_code
        ]
        return ', '.join(filter(None, parts))
    
    @property
    def latest_evaluation(self):
        """Return the latest pre-season evaluation for the player."""
        return self.evaluations.filter(evaluation_type="pre").order_by("-season_year").first()

    @property
    def overall_total(self):
        eval = self.latest_evaluation
        if eval:
            return eval.overall_total
        return 0

    @property
    def total_pitching(self):
        eval = self.latest_evaluation
        if eval:
            return eval.total_pitching
        return 0

    @property
    def total_catcher(self):
        eval = self.latest_evaluation
        if eval:
            return eval.total_catcher
        return 0

    @property
    def tier_spot(self):
        total = self.overall_total
        if total >= 38:
            return 1
        elif total >= 34:
            return 2
        elif total >= 30:
            return 3
        elif total >= 26:
            return 4
        return 5

    @property
    def pitcher_tier(self):
        total = self.total_pitching
        if total >= 9:
            return "Ace"
        elif total >= 7:
            return "Strong"
        elif total >= 5:
            return "Development"
        return "None"

    @property
    def catcher_tier(self):
        total = self.total_catcher
        if total >= 9:
            return "Elite"
        elif total >= 7:
            return "Strong"
        elif total >= 5:
            return "Emergency"
        return "None"