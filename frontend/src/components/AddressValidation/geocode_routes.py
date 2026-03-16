import hashlib
import uuid
import threading
import pandas as pd
from io import StringIO
from flask import Blueprint, request, jsonify
from .models import GeocodeResult
from . import db

# This is a placeholder for your actual geocoding logic
def perform_geocode(address):
    """
    Placeholder for a function that calls an external geocoding service.
    It should return a dictionary with 'latitude', 'longitude', and 'in_district'.
    """
    # In a real implementation, you would call a service like Google Maps, Here, etc.
    # and then check if the coordinates are within your district polygon.
    print(f"Geocoding address: {address}")
    # Mocked response:
    if "Indianapolis" in address:
        return {'latitude': 39.7684, 'longitude': -86.1581, 'in_district': True}
    return {'latitude': None, 'longitude': None, 'in_district': False}


geocode_bp = Blueprint('geocode_bp', __name__)

# Using simple dictionaries for caching and job storage.
# In a production environment, use Redis or a database.
file_hash_cache = {}
jobs = {}

def process_csv_background(job_id, csv_content, file_hash):
    """The background task for processing the CSV."""
    try:
        jobs[job_id]['status'] = 'PROCESSING'

        # Use pandas to read CSV content
        # This is more robust for finding the address column
        df = pd.read_csv(StringIO(csv_content))
        
        address_column = None
        # Find address column (case-insensitive)
        for col in df.columns:
            if col.lower() in ['address', 'street', 'location']:
                address_column = col
                break
        
        if not address_column:
            raise ValueError("Could not find a column with addresses (e.g., 'address', 'street').")

        addresses = df[address_column].dropna().tolist()
        
        # Reuse the existing processing logic
        response = process_addresses_sync(addresses, file_hash)

        # Combine original data with geocode results
        results_df = pd.DataFrame(response.get_json()['results'])
        # Preserve original data by merging
        merged_df = pd.merge(df, results_df, left_on=address_column, right_on='address', how='left')

        # If the merge created a duplicate address column, drop one.
        if 'address_y' in merged_df.columns:
            merged_df = merged_df.drop(columns=['address_y'])
            merged_df = merged_df.rename(columns={'address_x': 'address'})

        jobs[job_id]['status'] = 'COMPLETED'
        jobs[job_id]['results'] = merged_df.to_dict(orient='records')

    except Exception as e:
        print(f"Job {job_id} failed: {e}")
        jobs[job_id]['status'] = 'FAILED'
        jobs[job_id]['error'] = str(e)

def process_addresses_sync(addresses, file_hash):
    """Synchronous version of address processing for internal use."""
    # This function contains the logic previously in process_addresses
    # It's now called by the background job.
    # ... implementation is the same as the original process_addresses ...
    # (This logic is moved into the function below to avoid repetition)
@geocode_bp.route('/api/geocode/check_hash', methods=['POST'])
def check_hash():
    data = request.get_json()
    file_hash = data.get('hash')
    if not file_hash:
        return jsonify({"error": "File hash is required"}), 400

    if file_hash in file_hash_cache:
        return jsonify({"results": file_hash_cache[file_hash]})
    else:
        return jsonify({}), 404

def process_addresses_logic(addresses, file_hash):
    """The core logic for geocoding a list of addresses."""
    if not addresses:
        return []

    results = []
    addresses_to_geocode = []
    
    # 1. Check for existing results in the database
    existing_results = GeocodeResult.query.filter(GeocodeResult.address.in_(addresses)).all()
    cached_results = {res.address: res.to_dict() for res in existing_results}
    
    for address in addresses:
        if address in cached_results:
            results.append(cached_results[address])
        else:
            addresses_to_geocode.append(address)

    # 2. Geocode addresses that were not in the cache
    if addresses_to_geocode:
        for address in addresses_to_geocode:
            geocoded_data = perform_geocode(address)
            result_entry = {**geocoded_data, 'address': address}
            results.append(result_entry)

            # 3. Save new results to the database
            new_result = GeocodeResult(address=address, **geocoded_data)
            db.session.add(new_result)
        db.session.commit()

    # 4. Cache the full result set against the file hash
    if file_hash:
        file_hash_cache[file_hash] = results

    return results

@geocode_bp.route('/api/geocode/process', methods=['POST'])
def process_addresses():
    data = request.get_json()
    addresses = data.get('addresses')
    file_hash = data.get('hash')

    if not addresses:
        return jsonify({"error": "List of addresses is required"}), 400

    results = process_addresses_logic(addresses, file_hash)
    return jsonify({"results": results})

@geocode_bp.route('/api/geocode/start_job', methods=['POST'])
def start_job():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    csv_content = file.read().decode('utf-8')
    file_hash = hashlib.sha256(csv_content.encode('utf-8')).hexdigest()

    job_id = str(uuid.uuid4())
    jobs[job_id] = {'status': 'PENDING'}

    thread = threading.Thread(target=process_csv_background, args=(job_id, csv_content, file_hash))
    thread.start()

    return jsonify({"job_id": job_id})

@geocode_bp.route('/api/geocode/job_status/<job_id>', methods=['GET'])
def job_status(job_id):
    job = jobs.get(job_id)
    if not job:
        return jsonify({"error": "Job not found"}), 404
    
    return jsonify(job)