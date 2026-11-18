from flask import Blueprint, jsonify
from database import get_db

dashboard_bp = Blueprint('dashboard', __name__)


@dashboard_bp.route('/stats', methods=['GET'])
def get_stats():
    """Return aggregated dashboard statistics."""
    db = get_db()

    # Taxi stats
    taxi_stats = db.execute('''
        SELECT
            COUNT(*) as total_taxis,
            SUM(CASE WHEN status='available' THEN 1 ELSE 0 END) as available_taxis,
            SUM(CASE WHEN status='busy' THEN 1 ELSE 0 END) as busy_taxis,
            SUM(CASE WHEN status='offline' THEN 1 ELSE 0 END) as offline_taxis
        FROM taxis
    ''').fetchone()

    # Trip stats
    trip_stats = db.execute('''
        SELECT
            COUNT(*) as total_trips,
            ROUND(SUM(distance), 2) as total_distance,
            ROUND(AVG(distance), 2) as avg_distance,
            ROUND(AVG(duration), 1) as avg_duration,
            SUM(CASE WHEN algorithm='dijkstra' THEN 1 ELSE 0 END) as dijkstra_trips,
            SUM(CASE WHEN algorithm='astar' THEN 1 ELSE 0 END) as astar_trips
        FROM trips
    ''').fetchone()

    # Recent trips
    recent_trips = db.execute('''
        SELECT t.id, t.pickup_name, t.dropoff_name, t.distance, t.duration,
               t.algorithm, t.created_at, tx.name as taxi_name
        FROM trips t
        LEFT JOIN taxis tx ON t.taxi_id = tx.id
        ORDER BY t.created_at DESC
        LIMIT 5
    ''').fetchall()

    # Top taxis by trips
    top_taxis = db.execute('''
        SELECT name, driver_name, total_trips, total_distance, status
        FROM taxis
        ORDER BY total_trips DESC
        LIMIT 5
    ''').fetchall()

    db.close()

    # Estimate time saved (assume 15% optimization improvement)
    total_dist = trip_stats['total_distance'] or 0
    estimated_time_saved = round(total_dist * 0.15 / 30 * 60, 1)  # 15% of distance at 30km/h

    return jsonify({
        'taxis': {
            'total': taxi_stats['total_taxis'],
            'available': taxi_stats['available_taxis'],
            'busy': taxi_stats['busy_taxis'],
            'offline': taxi_stats['offline_taxis'],
        },
        'trips': {
            'total': trip_stats['total_trips'],
            'total_distance_km': float(total_dist),
            'avg_distance_km': float(trip_stats['avg_distance'] or 0),
            'avg_duration_min': float(trip_stats['avg_duration'] or 0),
            'dijkstra_trips': trip_stats['dijkstra_trips'],
            'astar_trips': trip_stats['astar_trips'],
        },
        'optimization': {
            'estimated_time_saved_min': estimated_time_saved,
            'estimated_distance_saved_km': round(total_dist * 0.15, 2),
        },
        'recent_trips': [dict(t) for t in recent_trips],
        'top_taxis': [dict(t) for t in top_taxis],
    })
