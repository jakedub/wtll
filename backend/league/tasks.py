import pandas as pd
from io import StringIO
from celery import shared_task
from .models.geocode import GeocodeResult
from geopy.geocoders import Nominatim
from geopy.exc import GeocoderTimedOut, GeocoderUnavailable
from time import sleep

geolocator = Nominatim(user_agent="wtll-app")

# This is a placeholder for your actual geocoding logic
def perform_geocode(address, max_retries=3, retry_delay=2):
    location = None
    retries = 0
    while retries < max_retries and location is None:
        try:
            location = geolocator.geocode(address, timeout=10)
        except (GeocoderTimedOut, GeocoderUnavailable):
            retries += 1
            sleep(retry_delay)
    if location:
        return {
            'latitude': location.latitude,
            'longitude': location.longitude,
            'in_district': False  # Set default; can update after KML check
        }
    return {'latitude': None, 'longitude': None, 'in_district': False}


@shared_task(bind=True)
def process_csv_task(self, csv_content):
    """The background task for processing the CSV."""
    try:
        df = pd.read_csv(StringIO(csv_content))

        address_column = None
        for col in df.columns:
            if col.lower() in ['address', 'street', 'location']:
                address_column = col
                break

        if not address_column:
            raise ValueError("Could not find an address column (e.g., 'address', 'street').")

        addresses = df[address_column].dropna().unique().tolist()

        # 1. Find already cached results
        cached_results = {
            res.address: res.to_dict()
            for res in GeocodeResult.objects.filter(address__in=addresses)
        }

        # 2. Find which addresses are new
        new_addresses = [addr for addr in addresses if addr not in cached_results]

        # 3. Geocode new addresses and save them
        new_results_to_save = []
        for i, address in enumerate(new_addresses):
            geocoded_data = perform_geocode(address)
            self.update_state(state='PROGRESS', meta={'current': i + 1, 'total': len(new_addresses)})
            cached_results[address] = {**geocoded_data, 'address': address}
            new_results_to_save.append(GeocodeResult(address=address, **geocoded_data))

        if new_results_to_save:
            GeocodeResult.objects.bulk_create(new_results_to_save, ignore_conflicts=True)

        results_df = pd.DataFrame.from_records(list(cached_results.values()))
        merged_df = pd.merge(df, results_df, left_on=address_column, right_on='address', how='left')

        return {'status': 'COMPLETED', 'results': merged_df.to_dict(orient='records')}
    except Exception as e:
        return {'status': 'FAILED', 'error': str(e)}