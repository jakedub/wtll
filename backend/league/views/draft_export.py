import io
from django.http import HttpResponse
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework.views import APIView
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter
from league.models.draft import Draft
from league.models.draft_selection import DraftSelection
from league.models.teams import Team
from league.models.divisions import Division


HEADER_FILL = PatternFill('solid', start_color='1F3864')
HEADER_FONT = Font(name='Arial', bold=True, color='FFFFFF', size=10)
TEAM_FILL   = PatternFill('solid', start_color='D9E1F2')
TEAM_FONT   = Font(name='Arial', bold=True, size=10)
BODY_FONT   = Font(name='Arial', size=10)
CENTER      = Alignment(horizontal='center', vertical='center')
LEFT        = Alignment(horizontal='left', vertical='center')

thin = Side(style='thin', color='BFBFBF')
BORDER = Border(left=thin, right=thin, top=thin, bottom=thin)

JERSEY_SIZES = ['YXS', 'YS', 'YM', 'YL', 'YXL', 'AS', 'AM', 'AL', 'AXL', 'AXXL']


def style_header_row(ws, row, col_count):
    for col in range(1, col_count + 1):
        cell = ws.cell(row=row, column=col)
        cell.font = HEADER_FONT
        cell.fill = HEADER_FILL
        cell.alignment = CENTER
        cell.border = BORDER


def style_team_row(ws, row, col_count):
    for col in range(1, col_count + 1):
        cell = ws.cell(row=row, column=col)
        cell.font = TEAM_FONT
        cell.fill = TEAM_FILL
        cell.border = BORDER


def style_body_row(ws, row, col_count):
    for col in range(1, col_count + 1):
        cell = ws.cell(row=row, column=col)
        cell.font = BODY_FONT
        cell.border = BORDER
        cell.alignment = LEFT if col == 1 else CENTER


def set_col_widths(ws, widths):
    for i, w in enumerate(widths, 1):
        ws.column_dimensions[get_column_letter(i)].width = w


@method_decorator(csrf_exempt, name='dispatch')
class ExportDraftResultsCSV(APIView):
    """
    Exports draft results as .xlsx with two sheets:
      Sheet 1 — Draft Results (players grouped by team)
      Sheet 2 — Roster Sheet (jersey size counts per team, grouped by division)
    """

    def get(self, request, draft_id):
        try:
            draft = Draft.objects.get(id=draft_id)
        except Draft.DoesNotExist:
            return HttpResponse('Draft not found', status=404)

        teams = Team.objects.filter(
            id__in=DraftSelection.objects.filter(draft=draft)
                .values_list('team_id', flat=True)
                .distinct()
        ).order_by('name')

        wb = Workbook()

        # ── Sheet 1: Draft Results ─────────────────────────────────────────────
        ws1 = wb.active
        ws1.title = 'Draft Results'

        DRAFT_COLS = [
            'Player Name', 'Division', 'Batting Hand', 'Throwing Hand',
            'Tier', 'Pitcher Tier', 'Catcher Tier',
            'Hitting', 'Fielding', 'Throwing', 'Pitching', 'Catching', 'Overall',
        ]
        COL_COUNT_1 = len(DRAFT_COLS)

        ws1.merge_cells(start_row=1, start_column=1, end_row=1, end_column=COL_COUNT_1)
        title_cell = ws1.cell(row=1, column=1, value=f'{draft.name} — {draft.year} Draft Results')
        title_cell.font = Font(name='Arial', bold=True, size=13)
        title_cell.alignment = CENTER
        ws1.row_dimensions[1].height = 24

        current_row = 2

        for team in teams:
            ws1.merge_cells(
                start_row=current_row, start_column=1,
                end_row=current_row, end_column=COL_COUNT_1
            )
            ws1.cell(row=current_row, column=1, value=f'{team.name}  |  Coach: {team.coach or "—"} |  Assistant Coach: {team.assistant_coach or "—"}')
            style_team_row(ws1, current_row, COL_COUNT_1)
            ws1.row_dimensions[current_row].height = 18
            current_row += 1

            for col, label in enumerate(DRAFT_COLS, 1):
                ws1.cell(row=current_row, column=col, value=label)
            style_header_row(ws1, current_row, COL_COUNT_1)
            ws1.row_dimensions[current_row].height = 16
            current_row += 1

            selections = (
                DraftSelection.objects
                .filter(draft=draft, team=team)
                .select_related('player', 'player__division')
                .order_by('selected_at')
            )

            for sel in selections:
                player = sel.player
                evaluation = player.evaluations.filter(season_year=draft.year).first()

                row_data = [
                    f"{player.first_name} {player.last_name}",
                    player.division.name if player.division else '',
                    getattr(player, 'batting_hand', '') or '',
                    getattr(player, 'throwing_hand', '') or '',
                    getattr(player, 'tier_spot', '') or '',
                    getattr(player, 'pitcher_tier', '') or '',
                    getattr(player, 'catcher_tier', '') or '',
                    getattr(evaluation, 'total_hitting', '') if evaluation else '',
                    getattr(evaluation, 'total_fielding', '') if evaluation else '',
                    getattr(evaluation, 'total_throwing', '') if evaluation else '',
                    getattr(evaluation, 'total_pitching', '') if evaluation else '',
                    getattr(evaluation, 'total_catcher', '') if evaluation else '',
                    getattr(evaluation, 'overall_total', '') if evaluation else '',
                ]
                for col, val in enumerate(row_data, 1):
                    ws1.cell(row=current_row, column=col, value=val)
                style_body_row(ws1, current_row, COL_COUNT_1)
                current_row += 1

            current_row += 1

        set_col_widths(ws1, [24, 14, 12, 13, 6, 10, 10, 8, 8, 9, 9, 9, 9])

        # ── Sheet 2: Roster Sheet ──────────────────────────────────────────────
        ws2 = wb.create_sheet(title='Jersey Roster Sheet')

        COL_COUNT_2 = 2 + len(JERSEY_SIZES)

        ws2.merge_cells(start_row=1, start_column=1, end_row=1, end_column=COL_COUNT_2)
        title2 = ws2.cell(row=1, column=1, value=f'{draft.name} — {draft.year} Roster Sheet')
        title2.font = Font(name='Arial', bold=True, size=13)
        title2.alignment = CENTER
        ws2.row_dimensions[1].height = 24

        current_row = 2

        divisions = Division.objects.filter(
            id__in=teams.values_list('division_id', flat=True).distinct()
        ).order_by('name')

        for division in divisions:
            ws2.merge_cells(
                start_row=current_row, start_column=1,
                end_row=current_row, end_column=COL_COUNT_2
            )
            div_cell = ws2.cell(row=current_row, column=1, value=f'Division: {division.name}')
            div_cell.font = Font(name='Arial', bold=True, size=11, color='FFFFFF')
            div_cell.fill = PatternFill('solid', start_color='2E4057')
            div_cell.alignment = LEFT
            ws2.row_dimensions[current_row].height = 18
            current_row += 1

            ws2.cell(row=current_row, column=1, value='Team Name')
            ws2.cell(row=current_row, column=2, value='Jersey Color')
            ws2.cell(row=current_row, column=3, value='Coach')
            ws2.cell(row=current_row, column=4, value='Assistant Coach')
            for i, size in enumerate(JERSEY_SIZES, 5):
                ws2.cell(row=current_row, column=i, value=size)
            style_header_row(ws2, current_row, COL_COUNT_2)
            ws2.row_dimensions[current_row].height = 16
            current_row += 1

            for team in teams.filter(division_id=division.id):
                selections = DraftSelection.objects.filter(
                    draft=draft, team=team
                ).select_related('player')

                size_counts = {size: 0 for size in JERSEY_SIZES}
                for sel in selections:
                    size = (getattr(sel.player, 'jersey_size', '') or '').upper().strip()
                    if size in size_counts:
                        size_counts[size] += 1

                ws2.cell(row=current_row, column=1, value=team.name)
                ws2.cell(row=current_row, column=2, value=team.jersey_color or '—')
                ws2.cell(row=current_row, column=3, value=team.coach or '—')
                ws2.cell(row=current_row, column=4, value=team.assistant_coach or '—')
                for i, size in enumerate(JERSEY_SIZES, 5):
                    count = size_counts[size]
                    ws2.cell(row=current_row, column=i, value=count if count > 0 else '')
                style_body_row(ws2, current_row, COL_COUNT_2)
                current_row += 1

            current_row += 1

        set_col_widths(ws2, [22, 20] + [7] * len(JERSEY_SIZES))

        # ── Stream response ────────────────────────────────────────────────────
        buffer = io.BytesIO()
        wb.save(buffer)
        buffer.seek(0)

        filename = f"draft_{draft.name}_{draft.year}.xlsx"
        response = HttpResponse(
            buffer.read(),
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response