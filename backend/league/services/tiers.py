# league/services/tiers.py

def calculate_overall_tier(score):
    """
    Assign overall tier based on overall_score
    """
    if score >= 38:
        return "Tier 1"
    elif score >= 34:
        return "Tier 2"
    elif score >= 30:
        return "Tier 3"
    elif score >= 26:
        return "Tier 4"
    return "Tier 5"