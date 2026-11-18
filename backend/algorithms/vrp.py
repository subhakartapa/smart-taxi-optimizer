import math
import itertools
from typing import List, Tuple, Dict
from .graph_builder import haversine


def nearest_neighbor_tour(locations: List[Tuple[float, float, str]]) -> List[int]:
    """
    Nearest Neighbor Heuristic for initial VRP solution.
    Greedy: always visit the nearest unvisited location next.
    
    Args:
        locations: List of (lat, lng, name) tuples
    Returns:
        List of indices representing the visit order
    """
    n = len(locations)
    if n == 0:
        return []
    if n == 1:
        return [0]

    unvisited = set(range(1, n))
    tour = [0]
    current = 0

    while unvisited:
        nearest = min(unvisited, key=lambda j: haversine(
            locations[current][0], locations[current][1],
            locations[j][0], locations[j][1]
        ))
        tour.append(nearest)
        unvisited.remove(nearest)
        current = nearest

    return tour


def two_opt_improve(locations: List[Tuple[float, float, str]], tour: List[int],
                    max_iterations: int = 100) -> Tuple[List[int], float]:
    """
    2-opt local search improvement on an initial tour.
    Reverses sub-sequences to reduce crossing paths.
    
    Returns improved tour and total distance.
    """
    def tour_distance(t: List[int]) -> float:
        total = 0.0
        for i in range(len(t) - 1):
            total += haversine(locations[t[i]][0], locations[t[i]][1],
                               locations[t[i+1]][0], locations[t[i+1]][1])
        return total

    best_tour = tour[:]
    best_dist = tour_distance(best_tour)
    improved = True
    iterations = 0

    while improved and iterations < max_iterations:
        improved = False
        iterations += 1
        for i in range(1, len(best_tour) - 2):
            for j in range(i + 1, len(best_tour)):
                # Reverse segment [i..j]
                new_tour = best_tour[:i] + best_tour[i:j+1][::-1] + best_tour[j+1:]
                new_dist = tour_distance(new_tour)
                if new_dist < best_dist - 1e-10:
                    best_tour = new_tour
                    best_dist = new_dist
                    improved = True

    return best_tour, round(best_dist, 4)


def assign_stops_to_taxis(stops: List[Dict], taxis: List[Dict],
                          num_taxis: int) -> List[Dict]:
    """
    Partition stops across multiple taxis using a simple balanced assignment.
    Each taxi gets roughly equal number of stops.
    
    Args:
        stops: List of stop dicts with lat, lng, name
        taxis: List of available taxi dicts
        num_taxis: Number of taxis to use
    Returns:
        List of route assignments, one per taxi
    """
    n_stops = len(stops)
    n_taxis = min(num_taxis, len(taxis), n_stops)
    if n_taxis == 0:
        return []

    # First, get the optimized order using nearest neighbor + 2-opt
    locations = [(s['lat'], s['lng'], s.get('name', f'Stop {i}'))
                 for i, s in enumerate(stops)]
    
    initial_tour = nearest_neighbor_tour(locations)
    optimized_tour, total_dist = two_opt_improve(locations, initial_tour)

    # Distribute stops across taxis
    stops_per_taxi = math.ceil(n_stops / n_taxis)
    assignments = []

    for i in range(n_taxis):
        start_idx = i * stops_per_taxi
        end_idx = min(start_idx + stops_per_taxi, n_stops)
        taxi_stop_indices = optimized_tour[start_idx:end_idx]

        if not taxi_stop_indices:
            continue

        taxi_stops = [stops[idx] for idx in taxi_stop_indices]
        taxi = taxis[i] if i < len(taxis) else taxis[0]

        # Calculate route distance for this taxi
        route_dist = 0.0
        route_points = [(taxi['lat'], taxi['lng'])]  # Start from taxi location

        for stop in taxi_stops:
            route_points.append((stop['lat'], stop['lng']))

        for k in range(len(route_points) - 1):
            route_dist += haversine(route_points[k][0], route_points[k][1],
                                    route_points[k+1][0], route_points[k+1][1])

        assignments.append({
            'taxi_id': taxi['id'],
            'taxi_name': taxi['name'],
            'driver_name': taxi.get('driver_name', 'Driver'),
            'stops': taxi_stops,
            'route_distance_km': round(route_dist, 3),
            'estimated_duration_min': round(route_dist / 30 * 60, 1),
            'route_coords': [[p[0], p[1]] for p in route_points]
        })

    return assignments


def solve_vrp(stops: List[Dict], taxis: List[Dict]) -> Dict:
    """
    Solve a basic Vehicle Routing Problem.
    
    1. Use Nearest Neighbor for initial ordering
    2. Apply 2-opt improvement
    3. Distribute among available taxis
    
    Returns complete VRP solution with per-taxi routes.
    """
    if not stops:
        return {"error": "No stops provided"}
    if not taxis:
        return {"error": "No available taxis"}

    locations = [(s['lat'], s['lng'], s.get('name', f'Stop {i}'))
                 for i, s in enumerate(stops)]

    # Step 1: Nearest Neighbor
    nn_tour = nearest_neighbor_tour(locations)
    nn_stops_ordered = [stops[i] for i in nn_tour]
    
    nn_dist = sum(
        haversine(locations[nn_tour[i]][0], locations[nn_tour[i]][1],
                  locations[nn_tour[i+1]][0], locations[nn_tour[i+1]][1])
        for i in range(len(nn_tour)-1)
    )

    # Step 2: 2-opt improvement
    optimized_tour, opt_dist = two_opt_improve(locations, nn_tour)
    optimized_stops_ordered = [stops[i] for i in optimized_tour]

    improvement_pct = round((nn_dist - opt_dist) / nn_dist * 100, 1) if nn_dist > 0 else 0

    # Step 3: Assign to taxis
    num_taxis = max(1, min(len(taxis), math.ceil(len(stops) / 3)))
    assignments = assign_stops_to_taxis(stops, taxis, num_taxis)

    total_distance = sum(a['route_distance_km'] for a in assignments)

    return {
        "algorithm": "vrp_nearest_neighbor_2opt",
        "total_stops": len(stops),
        "taxis_used": len(assignments),
        "total_distance_km": round(total_distance, 3),
        "nn_distance_km": round(nn_dist, 3),
        "optimized_distance_km": round(opt_dist, 3),
        "improvement_percent": improvement_pct,
        "stop_order": optimized_stops_ordered,
        "taxi_assignments": assignments,
        "description": "Vehicle Routing Problem solved using Nearest Neighbor heuristic for initial ordering, then 2-opt local search for improvement. Stops are balanced across available taxis."
    }
