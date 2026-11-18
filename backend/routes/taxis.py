from flask import Blueprint, request, jsonify
from database import get_db
from algorithms.graph_builder import haversine
import math

taxis_bp = Blueprint('taxis', __name__)


@taxis_bp.route('/', methods=['GET'])
def get_taxis():
    """Return all taxis."""
    db = get_db()
    taxis = db.execute(
        "SELECT * FROM taxis ORDER BY name"
    ).fetchall()
    db.close()
    return jsonify([dict(t) for t in taxis])


@taxis_bp.route('/', methods=['POST'])
def add_taxi():
    """Register a new taxi."""
    data = request.get_json()

    name = data.get('name', '').strip()
    driver_name = data.get('driver_name', '').strip()
    lat = data.get('lat')
    lng = data.get('lng')

    if not name or not driver_name:
        return jsonify({'error': 'Taxi name and driver name are required'}), 400
    if lat is None or lng is None:
        return jsonify({'error': 'Coordinates are required'}), 400
    if not (-90 <= float(lat) <= 90) or not (-180 <= float(lng) <= 180):
        return jsonify({'error': 'Invalid coordinates'}), 400

    db = get_db()
    # Check duplicate name
    existing = db.execute("SELECT id FROM taxis WHERE name = ?", (name,)).fetchone()
    if existing:
        db.close()
        return jsonify({'error': f'Taxi with name {name} already exists'}), 409

    cursor = db.execute(
        "INSERT INTO taxis (name, driver_name, lat, lng, status) VALUES (?, ?, ?, ?, 'available')",
        (name, driver_name, float(lat), float(lng))
    )
    db.commit()
    taxi_id = cursor.lastrowid
    taxi = db.execute("SELECT * FROM taxis WHERE id = ?", (taxi_id,)).fetchone()
    db.close()
    return jsonify(dict(taxi)), 201


@taxis_bp.route('/<int:taxi_id>', methods=['GET'])
def get_taxi(taxi_id):
    db = get_db()
    taxi = db.execute("SELECT * FROM taxis WHERE id = ?", (taxi_id,)).fetchone()
    db.close()
    if not taxi:
        return jsonify({'error': 'Taxi not found'}), 404
    return jsonify(dict(taxi))


@taxis_bp.route('/<int:taxi_id>/status', methods=['PUT'])
def update_taxi_status(taxi_id):
    """Update taxi availability status."""
    data = request.get_json()
    status = data.get('status')

    if status not in ('available', 'busy', 'offline'):
        return jsonify({'error': 'Status must be available, busy, or offline'}), 400

    db = get_db()
    taxi = db.execute("SELECT id FROM taxis WHERE id = ?", (taxi_id,)).fetchone()
    if not taxi:
        db.close()
        return jsonify({'error': 'Taxi not found'}), 404

    db.execute("UPDATE taxis SET status = ? WHERE id = ?", (status, taxi_id))
    db.commit()
    updated = db.execute("SELECT * FROM taxis WHERE id = ?", (taxi_id,)).fetchone()
    db.close()
    return jsonify(dict(updated))


@taxis_bp.route('/<int:taxi_id>', methods=['DELETE'])
def delete_taxi(taxi_id):
    db = get_db()
    taxi = db.execute("SELECT id FROM taxis WHERE id = ?", (taxi_id,)).fetchone()
    if not taxi:
        db.close()
        return jsonify({'error': 'Taxi not found'}), 404

    db.execute("DELETE FROM taxis WHERE id = ?", (taxi_id,))
    db.commit()
    db.close()
    return jsonify({'message': f'Taxi {taxi_id} deleted successfully'})


@taxis_bp.route('/assign', methods=['POST'])
def assign_taxi():
    """
    Find the nearest available taxi to a pickup location.
    Returns the best taxi and estimated arrival time.
    """
    data = request.get_json()
    pickup_lat = float(data.get('pickup_lat', 0))
    pickup_lng = float(data.get('pickup_lng', 0))

    if not (pickup_lat and pickup_lng):
        return jsonify({'error': 'Pickup coordinates required'}), 400

    db = get_db()
    taxis = db.execute(
        "SELECT * FROM taxis WHERE status='available'"
    ).fetchall()
    db.close()

    if not taxis:
        return jsonify({'error': 'No available taxis at this time'}), 404

    # Find nearest taxi
    best_taxi = None
    best_dist = float('inf')
    for taxi in taxis:
        dist = haversine(pickup_lat, pickup_lng, taxi['lat'], taxi['lng'])
        if dist < best_dist:
            best_dist = dist
            best_taxi = taxi

    if not best_taxi:
        return jsonify({'error': 'No suitable taxi found'}), 404

    avg_speed = 30.0  # km/h
    eta_min = round(best_dist / avg_speed * 60, 1)

    return jsonify({
        'taxi': dict(best_taxi),
        'distance_km': round(best_dist, 3),
        'eta_minutes': eta_min,
        'note': 'ETA is estimated based on straight-line distance at 30 km/h average speed.'
    })
