from flask import Blueprint, request, jsonify
from database import get_db
import json

trips_bp = Blueprint('trips', __name__)


@trips_bp.route('/', methods=['GET'])
def get_trips():
    """Get trip history with optional filtering."""
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 20))
    algorithm = request.args.get('algorithm')
    offset = (page - 1) * per_page

    db = get_db()

    query = "SELECT t.*, tx.name as taxi_name, tx.driver_name FROM trips t LEFT JOIN taxis tx ON t.taxi_id = tx.id"
    params = []

    if algorithm:
        query += " WHERE t.algorithm = ?"
        params.append(algorithm)

    query += " ORDER BY t.created_at DESC LIMIT ? OFFSET ?"
    params.extend([per_page, offset])

    trips = db.execute(query, params).fetchall()

    # Count total
    count_query = "SELECT COUNT(*) FROM trips"
    if algorithm:
        count_query += " WHERE algorithm = ?"
        total = db.execute(count_query, [algorithm]).fetchone()[0]
    else:
        total = db.execute(count_query).fetchone()[0]

    db.close()

    trips_list = []
    for trip in trips:
        t = dict(trip)
        try:
            t['route_coords'] = json.loads(t['route_coords']) if t['route_coords'] else []
        except:
            t['route_coords'] = []
        trips_list.append(t)

    return jsonify({
        'trips': trips_list,
        'total': total,
        'page': page,
        'per_page': per_page,
        'total_pages': (total + per_page - 1) // per_page
    })


@trips_bp.route('/', methods=['POST'])
def save_trip():
    """Save a completed trip to database."""
    data = request.get_json()

    required = ['pickup_lat', 'pickup_lng', 'dropoff_lat', 'dropoff_lng', 'distance', 'duration', 'algorithm']
    for field in required:
        if field not in data:
            return jsonify({'error': f'Missing field: {field}'}), 400

    db = get_db()
    cursor = db.execute(
        '''INSERT INTO trips
           (taxi_id, pickup_lat, pickup_lng, pickup_name, dropoff_lat, dropoff_lng, dropoff_name,
            distance, duration, algorithm, route_coords)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)''',
        (
            data.get('taxi_id'),
            float(data['pickup_lat']),
            float(data['pickup_lng']),
            data.get('pickup_name', 'Unknown'),
            float(data['dropoff_lat']),
            float(data['dropoff_lng']),
            data.get('dropoff_name', 'Unknown'),
            float(data['distance']),
            float(data['duration']),
            data['algorithm'],
            json.dumps(data.get('route_coords', []))
        )
    )

    # Update taxi stats
    taxi_id = data.get('taxi_id')
    if taxi_id:
        db.execute(
            "UPDATE taxis SET total_trips = total_trips + 1, total_distance = total_distance + ? WHERE id = ?",
            (float(data['distance']), taxi_id)
        )

    db.commit()
    trip_id = cursor.lastrowid
    trip = db.execute("SELECT * FROM trips WHERE id = ?", (trip_id,)).fetchone()
    db.close()

    return jsonify(dict(trip)), 201


@trips_bp.route('/<int:trip_id>', methods=['GET'])
def get_trip(trip_id):
    db = get_db()
    trip = db.execute(
        "SELECT t.*, tx.name as taxi_name FROM trips t LEFT JOIN taxis tx ON t.taxi_id = tx.id WHERE t.id = ?",
        (trip_id,)
    ).fetchone()
    db.close()
    if not trip:
        return jsonify({'error': 'Trip not found'}), 404
    t = dict(trip)
    try:
        t['route_coords'] = json.loads(t['route_coords']) if t['route_coords'] else []
    except:
        t['route_coords'] = []
    return jsonify(t)
