from league.models import Division

DIVISION_MAP = {
    "Major - Player Pitch - Major Baseball": "Majors",
    "Minor - Player Pitch - AAA Baseball": "AAA Minor",
    "Minor - Coach Pitch - AA Baseball": "AA Minor",
    "Minor - Coach Pitch - Pee Wee": "PeeWee",
    "Tee Ball Clinics": "TeeBall",
}


def map_division(raw_division_name: str) -> Division:
    if not raw_division_name:
        raise ValueError("Division name is required.")

    cleaned = raw_division_name.strip()

    if cleaned not in DIVISION_MAP:
        raise ValueError(f"Unknown division from CSV: {cleaned}")

    mapped_name = DIVISION_MAP[cleaned]

    try:
        return Division.objects.get(name=mapped_name)
    except Division.DoesNotExist:
        raise ValueError(f"Mapped division does not exist in DB: {mapped_name}")
    
