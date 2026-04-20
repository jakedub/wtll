from django.db import models
from league.models.divisions import Division
from league.models.teams import Team

class Draft(models.Model):
    name = models.CharField(max_length=50)  # e.g., 'Fall 2026 Draft'
    year = models.PositiveIntegerField()
    selected_teams = models.ManyToManyField(Team, blank=True, related_name='drafts')
    division = models.ForeignKey(
        Division,
        on_delete=models.CASCADE,
        related_name='drafts'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    is_complete = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.name} - {self.year}"