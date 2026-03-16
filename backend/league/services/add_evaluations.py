import os
import pandas as pd
from django.db import transaction
from league.models.players import Player
from league.models.evaluations import Evaluation


def safe_int(value):
    """Convert CSV value to int or None."""
    if value is None:
        return None
    value = str(value).strip()
    if value == "":
        return None
    try:
        return int(value)
    except ValueError:
        return None


def import_evaluations_from_csv(csv_path, default_year=2026, evaluation_type="pre"):

    failures = []
    processed_players = set()
    processed_count = 0

    if not os.path.exists(csv_path):
        failures.append({
            "row": "file",
            "error": f"File not found: {csv_path}"
        })
        return {"processed": processed_count, "failures": failures}

    df = pd.read_csv(csv_path, dtype=str)
    df = df.fillna("")
    df.columns = df.columns.str.strip()

    csv_to_model_map = {
        "Hitting Form": "hitting_form",
        "Hitting Power": "hitting_power",
        "Hitting Contact": "hitting_contact",
        "Fielding Form": "fielding_form",
        "Fielding Glove": "fielding_glove",
        "Fielding Hustle": "fielding_hustle",
        "Throwing Form": "throwing_form",
        "Throwing Speed": "throwing_speed",
        "Throwing Accuracy": "throwing_accuracy",
        "Pitching Speed": "pitching_speed",
        "Pitching Accuracy": "pitching_accuracy",
        "Catcher Receiving": "catcher_receiving",
        "Catcher Blocking": "catcher_blocking",
    }

    for index, row in df.iterrows():

        row_number = index + 2

        try:

            full_name = (
                row.get("Player")
                or f"{row.get('First Name', '')} {row.get('Last Name', '')}"
            ).strip()

            if not full_name:
                failures.append({
                    "row": row_number,
                    "error": "Missing player name"
                })
                continue

            parts = full_name.split()

            if len(parts) < 2:
                failures.append({
                    "row": row_number,
                    "player": full_name,
                    "error": "Invalid player name"
                })
                continue

            first_name = parts[0]
            last_name = " ".join(parts[1:])

            try:
                player = Player.objects.get(
                    first_name__iexact=first_name,
                    last_name__iexact=last_name
                )
            except Player.DoesNotExist:
                failures.append({
                    "row": row_number,
                    "player": full_name,
                    "error": "Player not found"
                })
                continue

            except Player.MultipleObjectsReturned:
                failures.append({
                    "row": row_number,
                    "player": full_name,
                    "error": "Multiple players matched"
                })
                continue

            if player.id in processed_players:
                continue

            processed_players.add(player.id)

            with transaction.atomic():

                evaluation, created = Evaluation.objects.get_or_create(
                    player=player,
                    season_year=row.get("Season Year") or default_year,
                    evaluation_type=row.get("Evaluation Type") or evaluation_type,
                )

                # numeric ratings
                for csv_field, model_field in csv_to_model_map.items():

                    raw_value = row.get(csv_field)

                    value = safe_int(raw_value)

                    setattr(evaluation, model_field, value)

                # batting hand
                csv_batting = (row.get("Batting Hand") or "").strip().upper()

                if csv_batting in ["L", "R", "B"]:
                    evaluation.batting_hand = csv_batting
                elif hasattr(player, "batting_hand"):
                    evaluation.batting_hand = player.batting_hand

                # throwing hand
                csv_throwing = (row.get("Throwing Hand") or "").strip().upper()

                if csv_throwing in ["L", "R"]:
                    evaluation.throwing_hand = csv_throwing
                elif hasattr(player, "throwing_hand"):
                    evaluation.throwing_hand = player.throwing_hand

                evaluation.save()

                processed_count += 1

        except Exception as e:

            failures.append({
                "row": row_number,
                "player": full_name if "full_name" in locals() else None,
                "error": str(e),
            })

    return {
        "processed": processed_count,
        "failures": failures
    }