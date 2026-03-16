from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.contrib.auth import get_user_model
from .players import Player

User = get_user_model()

class Evaluation(models.Model):
    EVALUATION_TYPE_CHOICES = [
        ('pre', 'Pre-Season'),
        ('post', 'Post-Season'),
    ]
    
    player = models.ForeignKey(
        Player,
        on_delete=models.CASCADE,
        related_name='evaluations'
    )
    evaluator = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='evaluations_given'
    )
    season_year = models.IntegerField()
    evaluation_type = models.CharField(max_length=10, choices=EVALUATION_TYPE_CHOICES)

    # Hitting
    hitting_power = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)], null=True, blank=True)
    hitting_contact = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)], null=True, blank=True)
    hitting_form = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)], null=True, blank=True)

    # Fielding
    fielding_form = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)], null=True, blank=True)
    fielding_glove = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)], null=True, blank=True)
    fielding_hustle = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)], null=True, blank=True)

    # Throwing
    throwing_form = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)], null=True, blank=True)
    throwing_speed = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)], null=True, blank=True)
    throwing_accuracy = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)], null=True, blank=True)

    # Pitching
    pitching_speed = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)], null=True, blank=True)
    pitching_accuracy = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)], null=True, blank=True)

    # Catcher
    catcher_receiving = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)], null=True, blank=True)
    catcher_blocking = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)], null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('player', 'season_year', 'evaluation_type')
        ordering = ['-season_year', 'evaluation_type']

    def __str__(self):
        return f"{self.player} - {self.season_year} - {self.evaluation_type}"

    # --- Computed fields ---
    @property
    def total_hitting(self):
        return sum(filter(None, [self.hitting_power, self.hitting_contact, self.hitting_form]))

    @property
    def total_fielding(self):
        return sum(filter(None, [self.fielding_form, self.fielding_glove, self.fielding_hustle]))

    @property
    def total_throwing(self):
        return sum(filter(None, [self.throwing_form, self.throwing_speed, self.throwing_accuracy]))

    @property
    def total_pitching(self):
        return sum(filter(None, [self.pitching_speed, self.pitching_accuracy]))

    @property
    def total_catcher(self):
        return sum(filter(None, [self.catcher_receiving, self.catcher_blocking]))
    
    @property
    def overall_total(self):
        return self.total_hitting + self.total_fielding + self.total_throwing
    
    @property
    def tier_spot(self):
        if self.overall_total is None:
            return None
        if self.overall_total >= 38:
            return 1
        elif self.overall_total >= 34:
            return 2
        elif self.overall_total >= 30:
            return 3
        elif self.overall_total >= 26:
            return 4
        return 5