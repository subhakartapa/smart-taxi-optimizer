import heapq
import math
import time
import networkx as nx
from typing import List, Tuple, Dict, Optional
from .graph_builder import find_nearest_node, get_path_coordinates, calculate_path_distance, haversine


def astar(G: nx.Graph, source: int, target: int) -> Tuple[List[int], float, int]:
    """
    Custom A* Search Algorithm implementation.
    Returns: (path, distance, nodes_explored)

    Uses a heuristic (Haversine distance to goal) to guide the search.
    f(n) = g(n) + h(n)
      g(n) = actual cost from start to n
      h(n) = estimated cost from n to goal (admissible: never overestimates)
    
    Time Complexity: O(E) in best case with good heuristic
    Space Complexity: O(V)
    """
    target_data = G.nodes[target]
    
    def heuristic(node: int) -> float:
        """Haversine distance from node to target — admissible heuristic."""
        node_data = G.nodes[node]
        return haversine(node_data['lat'], node_data['lng'],
                         target_data['lat'], target_data['lng'])

    # Priority queue: (f_score, g_score, node)
    open_set = [(heuristic(source), 0.0, source)]
    g_scores = {source: 0.0}
    f_scores = {source: heuristic(source)}
    came_from = {source: None}
    closed_set = set()
    nodes_explored = 0

    while open_set:
        _, g_current, current = heapq.heappop(open_set)

        if current in closed_set:
            continue
        closed_set.add(current)
        nodes_explored += 1

        if current == target:
            break

        for neighbor in G.neighbors(current):
            if neighbor in closed_set:
                continue

            edge_data = G.get_edge_data(current, neighbor)
            weight = edge_data.get('weight', 1.0) if edge_data else 1.0
            tentative_g = g_scores[current] + weight

            if neighbor not in g_scores or tentative_g < g_scores[neighbor]:
                g_scores[neighbor] = tentative_g
                f_score = tentative_g + heuristic(neighbor)
                f_scores[neighbor] = f_score
                came_from[neighbor] = current
                heapq.heappush(open_set, (f_score, tentative_g, neighbor))

    # Reconstruct path
    path = []
    node = target
    while node is not None:
        path.append(node)
        node = came_from.get(node)
    path.reverse()

    if not path or path[0] != source:
        return [], float('inf'), nodes_explored

    return path, g_scores.get(target, float('inf')), nodes_explored


def run_astar(G: nx.Graph, pickup_lat: float, pickup_lng: float,
              dropoff_lat: float, dropoff_lng: float) -> Dict:
    """
    Run A* algorithm between two geographic points.
    Returns full result dict with path coordinates, distance, timing info.
    """
    source = find_nearest_node(G, pickup_lat, pickup_lng)
    target = find_nearest_node(G, dropoff_lat, dropoff_lng)

    start_time = time.perf_counter()
    path, distance, nodes_explored = astar(G, source, target)
    elapsed_ms = (time.perf_counter() - start_time) * 1000

    if not path:
        return {"error": "No path found between locations"}

    coords = get_path_coordinates(G, path)
    actual_dist = calculate_path_distance(G, path)

    return {
        "algorithm": "astar",
        "algorithm_name": "A* Search Algorithm",
        "path_nodes": path,
        "coordinates": coords,
        "distance_km": round(actual_dist, 3),
        "nodes_explored": nodes_explored,
        "computation_time_ms": round(elapsed_ms, 3),
        "description": "A* uses a Haversine distance heuristic to prioritize exploring nodes closer to the destination, typically exploring fewer nodes than Dijkstra while still guaranteeing an optimal path."
    }
