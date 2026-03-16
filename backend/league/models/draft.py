from django.db import models
from league.models.players import Player
from league.models.teams import Team
from league.models.divisions import Division


class Draft(models.Model):
    name = models.CharField(max_length=50)  # e.g., 'Fall 2026 Draft'
    year = models.PositiveIntegerField()
    teams = models.ManyToManyField(Team, related_name='drafts', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} - {self.year}"


