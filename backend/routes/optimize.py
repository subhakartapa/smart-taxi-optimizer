import json
import requests
from flask import Blueprint, request, jsonify
from algorithms.graph_builder import build_grid_graph, haversine
from algorithms.dijkstra import run_dijkstra
from algorithms.astar import run_astar

optimize_bp = Blueprint('optimize', __name__)

# Cache the graph (built once per session)
_graph_cache = {}

def get_graph(center_lat: float, center_lng: float):
    """Get or build a graph centered near the given coordinates."""
    # Round to 1 decimal for caching
    key = (round(center_lat, 1), round(center_lng, 1))
    if key not in _graph_cache:
        _graph_cache[key] = build_grid_graph(center_lat, center_lng, grid_size=25, spacing_km=0.4)
    return _graph_cache[key]


def fetch_osrm_route(pickup_lat, pickup_lng, dropoff_lat, dropoff_lng):
    """
    Fetch real road route from OSRM public API.
    Returns route geometry and distance/duration.
    NOTE: This uses simulated traffic estimates (speed-based), NOT real-time traffic data.
    """
    try:
        url = (f"http://router.project-osrm.org/route/v1/driving/"
               f"{pickup_lng},{pickup_lat};{dropoff_lng},{dropoff_lat}"
               f"?overview=full&geometries=geojson&steps=false")
        resp = requests.get(url, timeout=8)
        data = resp.json()

        if data.get('code') == 'Ok' and data.get('routes'):
            route = data['routes'][0]
            coords = route['geometry']['coordinates']
            # OSRM returns [lng, lat], convert to [lat, lng]
            coords_latlong = [[c[1], c[0]] for c in coords]
            return {
                'coordinates': coords_latlong,
                'distance_km': round(route['distance'] / 1000, 3),
                'duration_min': round(route['duration'] / 60, 1),
                'source': 'osrm'
            }
    except Exception as e:
        pass
    return None


@optimize_bp.route('/route', methods=['POST'])
def optimize_route():
    """
    Optimize a single route using Dijkstra or A* on a local NetworkX graph.
    Also fetches real road geometry from OSRM for map display.
    """
    data = request.get_json()

    pickup_lat = float(data.get('pickup_lat', 0))
    pickup_lng = float(data.get('pickup_lng', 0))
    dropoff_lat = float(data.get('dropoff_lat', 0))
    dropoff_lng = float(data.get('dropoff_lng', 0))
    algorithm = data.get('algorithm', 'both')  # 'dijkstra', 'astar', or 'both'

    if not all([pickup_lat, pickup_lng, dropoff_lat, dropoff_lng]):
        return jsonify({'error': 'Missing coordinates'}), 400

    # Validate reasonable coordinate ranges
    for val, name in [(pickup_lat, 'pickup_lat'), (pickup_lng, 'pickup_lng'),
                      (dropoff_lat, 'dropoff_lat'), (dropoff_lng, 'dropoff_lng')]:
        if not (-90 <= val <= 90 if 'lat' in name else -180 <= val <= 180):
            return jsonify({'error': f'Invalid coordinate: {name}'}), 400

    center_lat = (pickup_lat + dropoff_lat) / 2
    center_lng = (pickup_lng + dropoff_lng) / 2
    G = get_graph(center_lat, center_lng)

    results = {}

    # Run selected algorithms
    if algorithm in ('dijkstra', 'both'):
        results['dijkstra'] = run_dijkstra(G, pickup_lat, pickup_lng, dropoff_lat, dropoff_lng)

    if algorithm in ('astar', 'both'):
        results['astar'] = run_astar(G, pickup_lat, pickup_lng, dropoff_lat, dropoff_lng)

    # Try to get real road geometry from OSRM
    osrm_route = fetch_osrm_route(pickup_lat, pickup_lng, dropoff_lat, dropoff_lng)

    # Straight-line "normal" route for comparison
    straight_dist = haversine(pickup_lat, pickup_lng, dropoff_lat, dropoff_lng)

    # Use graph-based distance as the optimized distance
    opt_result = results.get('dijkstra') or results.get('astar') or {}
    opt_dist = opt_result.get('distance_km', straight_dist)

    # Speed estimate: ~30 km/h avg urban speed
    avg_speed = 30.0

    response = {
        'results': results,
        'osrm_route': osrm_route,
        'straight_line_distance_km': round(straight_dist, 3),
        'comparison': {
            'normal_distance_km': round(straight_dist * 1.4, 3),  # Approximate real road via detour
            'normal_duration_min': round(straight_dist * 1.4 / avg_speed * 60, 1),
            'optimized_distance_km': round(opt_dist, 3),
            'optimized_duration_min': round(opt_dist / avg_speed * 60, 1),
            'distance_saved_km': round(max(0, straight_dist * 1.4 - opt_dist), 3),
            'time_saved_min': round(max(0, (straight_dist * 1.4 - opt_dist) / avg_speed * 60), 1),
        },
        'traffic_note': '⚠️ Duration estimates are speed-based simulations (avg 30 km/h). Real-time traffic data is NOT integrated.'
    }

    return jsonify(response)


@optimize_bp.route('/compare', methods=['POST'])
def compare_routes():
    """Compare Dijkstra vs A* performance metrics."""
    data = request.get_json()

    pickup_lat = float(data.get('pickup_lat', 0))
    pickup_lng = float(data.get('pickup_lng', 0))
    dropoff_lat = float(data.get('dropoff_lat', 0))
    dropoff_lng = float(data.get('dropoff_lng', 0))

    if not all([pickup_lat, pickup_lng, dropoff_lat, dropoff_lng]):
        return jsonify({'error': 'Missing coordinates'}), 400

    center_lat = (pickup_lat + dropoff_lat) / 2
    center_lng = (pickup_lng + dropoff_lng) / 2
    G = get_graph(center_lat, center_lng)

    dijkstra_result = run_dijkstra(G, pickup_lat, pickup_lng, dropoff_lat, dropoff_lng)
    astar_result = run_astar(G, pickup_lat, pickup_lng, dropoff_lat, dropoff_lng)
    straight = haversine(pickup_lat, pickup_lng, dropoff_lat, dropoff_lng)

    comparison = {
        'straight_line_km': round(straight, 3),
        'algorithms': {
            'dijkstra': dijkstra_result,
            'astar': astar_result,
        },
        'summary': {
            'faster_algorithm': 'astar' if (astar_result.get('computation_time_ms', 999) <
                                            dijkstra_result.get('computation_time_ms', 999)) else 'dijkstra',
            'fewer_nodes': 'astar' if (astar_result.get('nodes_explored', 999) <
                                       dijkstra_result.get('nodes_explored', 999)) else 'dijkstra',
            'same_distance': abs((dijkstra_result.get('distance_km', 0) or 0) -
                                 (astar_result.get('distance_km', 0) or 0)) < 0.01
        }
    }
    return jsonify(comparison)


@optimize_bp.route('/multistop', methods=['POST'])
def multistop_optimize():
    """Solve a VRP for multiple stops with available taxis."""
    from algorithms.vrp import solve_vrp
    from database import get_db

    data = request.get_json()
    stops = data.get('stops', [])

    if len(stops) < 2:
        return jsonify({'error': 'At least 2 stops are required'}), 400

    # Validate stops
    for i, stop in enumerate(stops):
        if 'lat' not in stop or 'lng' not in stop:
            return jsonify({'error': f'Stop {i+1} is missing lat/lng coordinates'}), 400

    # Get available taxis
    db = get_db()
    taxis = db.execute(
        "SELECT id, name, driver_name, lat, lng FROM taxis WHERE status='available' ORDER BY id"
    ).fetchall()
    db.close()

    taxis_list = [dict(t) for t in taxis]
    if not taxis_list:
        return jsonify({'error': 'No available taxis found'}), 400

    result = solve_vrp(stops, taxis_list)
    return jsonify(result)
