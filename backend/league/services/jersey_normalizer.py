"""
Jersey size normalization service.

This module strictly maps external CSV jersey size values
into controlled internal codes used by the system.

If an unknown value is encountered, it raises an error
instead of silently guessing.
"""

JERSEY_MAP = {
    "youth x-small": "YXS",
    "youth small": "YS",
    "youth medium": "YM",
    "youth large": "YL",
    "youth x-large": "YXL",
    "adult small": "AS",
    "adult medium": "AM",
    "adult large": "AL",
    "adult x-large": "AXL",
}


def normalize_jersey_size(value: str) -> str:
    """
    Normalize jersey size from CSV into internal short code.

    Example:
        "Youth Medium" -> "YM"
        "Adult Small"  -> "AS"

    Raises:
        ValueError if size is unknown.
    """

    if not value:
        return ""

    cleaned = value.strip().lower()

    if cleaned not in JERSEY_MAP:
        raise ValueError(f"Unknown jersey size from CSV: {value}")

    return JERSEY_MAP[cleaned]
