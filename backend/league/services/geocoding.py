from typing import List, Tuple, Optional
import logging

from league.models.players import Player
from league.services.google_maps import geocode_address

logger = logging.getLogger(__name__)


def _round_coord(value: Optional[float]) -> Optional[float]:
    if value is None:
        return None
    try:
        return round(float(value), 5)
    except Exception:
        return None


def geocode_missing_players_batch() -> Tuple[List[Player], List[str]]:
    """
    Geocode all players missing latitude/longitude.
    Returns updated Player objects and list of failed addresses.
    """
    updated_players: List[Player] = []
    failed_addresses: List[str] = []

    # Ensure deterministic order by id to match test expectations
    players_to_geocode = (
        Player.objects.filter(latitude__isnull=True) | Player.objects.filter(longitude__isnull=True)
    ).distinct().order_by('id')

    for player in players_to_geocode.distinct():
        address = player.full_address
        if not address:
            failed_addresses.append('')
            logger.warning(f"Player {player.id} has no full_address to geocode")
            continue

        try:
            lat_lng = geocode_address(address)
            if not lat_lng or lat_lng[0] is None or lat_lng[1] is None:
                failed_addresses.append(address)
                logger.warning(f"Failed to geocode Player {player.id} at '{address}'")
                continue

            lat = _round_coord(lat_lng[0])
            lng = _round_coord(lat_lng[1])

            player.latitude = lat
            player.longitude = lng
            player.save(update_fields=['latitude', 'longitude'])

            updated_players.append(player)
            logger.info(f"Geocoded Player {player.id} at '{address}': ({lat}, {lng})")
        except Exception as e:
            failed_addresses.append(address)
            logger.error(f"Error geocoding Player {player.id} at '{address}': {e}")

    return updated_players, failed_addresses


def geocode_single_address(address: str) -> Tuple[Optional[float], Optional[float], Optional[str]]:
    """
    Geocode a single address.
    Returns (lat, lng, error)
    """
    if not address:
        return None, None, "No address provided"

    try:
        lat_lng = geocode_address(address)
        if not lat_lng or lat_lng[0] is None or lat_lng[1] is None:
            return None, None, "No location found for the provided address"

        lat = _round_coord(lat_lng[0])
        lng = _round_coord(lat_lng[1])
        return lat, lng, None

    except Exception as e:
        logger.error(f"Geocoding service error for address '{address}': {e}")
        return None, None, str(e)