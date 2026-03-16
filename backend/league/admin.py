from django.contrib import admin
from league.models.divisions import Division
from league.models.teams import Team
from league.models.players import Player
from league.models.evaluations import Evaluation
from league.models.positions import Position
from league.models.draft import Draft
from league.models.draft_selection import DraftSelection
from django import forms

class BulkTeamForm(forms.ModelForm):
    divisions = forms.ModelMultipleChoiceField(
        queryset=Division.objects.all(),
        widget=admin.widgets.FilteredSelectMultiple("divisions", is_stacked=False),
        required=True,
        help_text="Select one or more divisions to create this team"
    )
    class Meta:
        model = Team
        fields = 'name', 'year', 'divisions'

@admin.register(Team)
class TeamAdmin(admin.ModelAdmin):
    list_display = ("name", "division", "year", "is_active")
    list_filter = ("division", "year", "is_active")
    search_fields = ("name", "is_active")
    form = BulkTeamForm

    actions = ["deactivate_teams"]

    def save_model(self, request, obj, form, change):
        team_name = form.cleaned_data.get('name')
        divisions = form.cleaned_data.get('divisions')
        year = form.cleaned_data.get('year')
        for division in divisions:
            Team.objects.create(name=team_name, division=division, year=year)
    @admin.action(description="Deactivate selected teams")
    def deactivate_teams(self, request, queryset):
        updated = queryset.update(is_active=False)
        self.message_user(request, f"{updated} teams have been deactivated.")
    
@admin.register(Division)
class DivisionAdmin(admin.ModelAdmin):
    list_display = ("name",)
    search_fields = ("name",)



@admin.register(Player)
class PlayerAdmin(admin.ModelAdmin):
    list_display = (
        "first_name",
        "last_name",
        "team",
        "division",
        "is_allstar",
        "is_showcase",
        "in_district",
        "latitude",
        "longitude",
        "is_eligible",
        "school_name",
        "tier_spot",    
        "pitcher_tier",   
        "catcher_tier",   
    )
    list_filter = (
        "team",
        "division",
        "is_allstar",
        "is_showcase",
        "in_district",
        "is_eligible"   
    )
    search_fields = ("first_name", "last_name", "email")

    readonly_fields = ("tier_spot", "pitcher_tier", "catcher_tier")

@admin.register(Evaluation)
class EvaluationAdmin(admin.ModelAdmin):
    list_display = ("player", "season_year", "evaluation_type", "total_hitting", "total_fielding", "total_throwing", "total_pitching", "total_catcher", "tier_spot", "overall_total")
    list_filter = ("season_year", "evaluation_type", "evaluator")
    search_fields = ("player__first_name", "player__last_name", "evaluator__username")

@admin.register(Position)
class PositionAdmin(admin.ModelAdmin):
    list_display = ("code",)
    search_fields = ("code",)

@admin.register(Draft)
class DraftAdmin(admin.ModelAdmin):
    list_display = ("name", "year")
    search_fields = ("name",)

@admin.register(DraftSelection)
class DraftSelectionAdmin(admin.ModelAdmin):
    list_display = ("draft", "player", "team", "division", "selected_at")
    list_filter = ("draft", "team", "division")
    search_fields = ("draft__name", "player__first_name", "player__last_name")