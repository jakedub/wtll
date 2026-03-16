"""
Boolean parsing service.

This module converts external CSV Yes/No-style values
into strict Python booleans.

It handles common variants and defaults unknown/blank values to False.
"""

def parse_yes_no(value) -> bool:
    """
    Convert common CSV boolean representations into True/False.

    Accepts:
        'yes', 'y', 'true', '1'  -> True
        'no', 'n', 'false', '0' -> False
        None, empty string       -> False

    Any unexpected value defaults to False (prints a warning).
    """

    if value is None:
        return False

    cleaned = str(value).strip().lower()

    if cleaned in {"yes", "y", "true", "1"}:
        return True
    elif cleaned in {"no", "n", "false", "0", ""}:
        return False
    else:
        print(f"Warning: Unexpected boolean value from CSV: {value}, defaulting to False")
        return False
