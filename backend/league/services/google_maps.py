# league/services/google_maps.py
import requests
from django.conf import settings
from time import sleep

GOOGLE_API_KEY = settings.GOOGLE_MAPS_API_KEY
GEOCODE_URL = "https://maps.googleapis.com/maps/api/geocode/json"

def geocode_address(address: str, max_retries=3, retry_delay=2):
    """
    Geocode an address using Google Maps Geocoding API.
    Returns (lat, lng) or (None, None) if failed.
    Retries on transient network errors.
    """
    if not address:
        return None, None

    retries = 0
    while retries < max_retries:
        try:
            response = requests.get(GEOCODE_URL, params={
                "address": address,
                "key": GOOGLE_API_KEY
            }, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            if data.get("status") == "OK" and data.get("results"):
                location = data["results"][0]["geometry"]["location"]
                return location["lat"], location["lng"]
            elif data.get("status") in ("OVER_QUERY_LIMIT", "RESOURCE_EXHAUSTED"):
                print(f"[GoogleMaps] Quota limit hit. Retrying after delay...")
                sleep(retry_delay)
                retries += 1
            else:
                print(f"[GoogleMaps] Failed to geocode address '{address}': {data.get('status')}")
                return None, None

        except requests.RequestException as e:
            print(f"[GoogleMaps] Error geocoding '{address}': {e}. Retrying...")
            retries += 1
            sleep(retry_delay)

    print(f"[GoogleMaps] Max retries exceeded for address '{address}'")
    return None, None