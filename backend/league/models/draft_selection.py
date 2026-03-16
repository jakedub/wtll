from django.db import models
from league.models.players import Player
from league.models.teams import Team
from league.models.divisions import Division
from league.models.draft import Draft

class DraftSelection(models.Model):
    draft = models.ForeignKey(Draft, related_name='selections', on_delete=models.CASCADE)
    team = models.ForeignKey(Team, related_name='draft_selections', on_delete=models.CASCADE)
    player = models.ForeignKey(Player, related_name='draft_selections', on_delete=models.CASCADE)
    division = models.ForeignKey(Division, on_delete=models.CASCADE)
    selected_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('draft', 'player')  # Player can only be drafted once per draft

    def __str__(self):
        return f"{self.player} -> {self.team} ({self.division}) in {self.draft.name}"