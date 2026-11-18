import heapq
import time
import networkx as nx
from typing import List, Tuple, Dict, Optional
from .graph_builder import find_nearest_node, get_path_coordinates, calculate_path_distance

def dijkstra(G: nx.Graph, source: int, target: int) -> Tuple[List[int], float, int]:
    """
    Custom Dijkstra's Algorithm implementation.
    Returns: (path, distance, nodes_explored)
    
    Uses a min-heap priority queue. For each node, maintains the shortest
    known distance from source. Relaxes edges iteratively.
    
    Time Complexity: O((V + E) log V)
    Space Complexity: O(V)
    """
    # Priority queue: (distance, node)
    pq = [(0.0, source)]
    distances = {source: 0.0}
    previous = {source: None}
    visited = set()
    nodes_explored = 0

    while pq:
        current_dist, current_node = heapq.heappop(pq)

        if current_node in visited:
            continue
        visited.add(current_node)
        nodes_explored += 1

        if current_node == target:
            break

        for neighbor in G.neighbors(current_node):
            if neighbor in visited:
                continue
            edge_data = G.get_edge_data(current_node, neighbor)
            weight = edge_data.get('weight', 1.0) if edge_data else 1.0
            new_dist = current_dist + weight

            if neighbor not in distances or new_dist < distances[neighbor]:
                distances[neighbor] = new_dist
                previous[neighbor] = current_node
                heapq.heappush(pq, (new_dist, neighbor))

    # Reconstruct path
    path = []
    node = target
    while node is not None:
        path.append(node)
        node = previous.get(node)
    path.reverse()

    if path[0] != source:
        return [], float('inf'), nodes_explored  # No path found

    return path, distances.get(target, float('inf')), nodes_explored


def run_dijkstra(G: nx.Graph, pickup_lat: float, pickup_lng: float,
                 dropoff_lat: float, dropoff_lng: float) -> Dict:
    """
    Run Dijkstra's algorithm between two geographic points.
    Returns full result dict with path coordinates, distance, timing info.
    """
    source = find_nearest_node(G, pickup_lat, pickup_lng)
    target = find_nearest_node(G, dropoff_lat, dropoff_lng)

    start_time = time.perf_counter()
    path, distance, nodes_explored = dijkstra(G, source, target)
    elapsed_ms = (time.perf_counter() - start_time) * 1000

    if not path:
        return {"error": "No path found between locations"}

    coords = get_path_coordinates(G, path)
    actual_dist = calculate_path_distance(G, path)

    return {
        "algorithm": "dijkstra",
        "algorithm_name": "Dijkstra's Algorithm",
        "path_nodes": path,
        "coordinates": coords,
        "distance_km": round(actual_dist, 3),
        "nodes_explored": nodes_explored,
        "computation_time_ms": round(elapsed_ms, 3),
        "description": "Dijkstra's algorithm explores all reachable nodes in order of increasing distance, guaranteeing the shortest path but potentially exploring many unnecessary nodes."
    }
