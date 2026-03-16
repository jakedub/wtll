from django.db import models
from league.models.divisions import Division

class Team(models.Model):
    name = models.CharField(max_length=100)
    coach = models.CharField(max_length=100, blank=True)
    is_active = models.BooleanField(default=True)
    year = models.PositiveIntegerField()
    division = models.ForeignKey(
        Division,
        on_delete=models.CASCADE,
        related_name='teams',
        null=True,  # allow existing rows to be null
        blank=True
    )

    class Meta:
        unique_together = ('name', 'division', 'year')

    def __str__(self):
        return f"{self.name} - {self.year}"