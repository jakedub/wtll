# league/services/player_import.py
import csv
from league.models.players import Player

def import_players_from_csv(file_obj):
    # Handle file-like OR raw CSV input
    if hasattr(file_obj, "read"):
        content = file_obj.read().decode("utf-8-sig").splitlines()
    else:
        content = file_obj

    reader = csv.DictReader(content)
    results = []

    for row in reader:
        first_name = row.get("first_name") or row.get("Player First Name") or ""
        last_name = row.get("last_name") or row.get("Player Last Name") or ""
        address = row.get("address_line_1") or row.get("Player Street") or ""

        first_name = first_name.strip()
        last_name = last_name.strip()
        address = address.strip()

        if not (first_name or last_name or address):
            continue

        player = Player.objects.create(
            first_name=first_name,
            last_name=last_name,
            address_line_1=address
        )

        results.append(player)

    return results