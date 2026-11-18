import math
import heapq
import networkx as nx
from typing import List, Tuple, Dict, Optional

def haversine(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Calculate great-circle distance between two points (km)."""
    R = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lng2 - lng1)
    a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlambda/2)**2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

def build_grid_graph(center_lat: float, center_lng: float,
                     grid_size: int = 20, spacing_km: float = 0.5) -> nx.Graph:
    """
    Build a city-like grid graph around a center coordinate.
    Each node represents an intersection, edges represent road segments.
    """
    G = nx.Graph()
    lat_deg = spacing_km / 111.0  # ~111 km per degree latitude
    lng_deg = spacing_km / (111.0 * math.cos(math.radians(center_lat)))

    # Add grid nodes
    nodes = {}
    for i in range(grid_size):
        for j in range(grid_size):
            node_id = i * grid_size + j
            lat = center_lat + (i - grid_size // 2) * lat_deg
            lng = center_lng + (j - grid_size // 2) * lng_deg
            G.add_node(node_id, lat=lat, lng=lng, pos=(lng, lat))
            nodes[(i, j)] = node_id

    # Add edges (horizontal, vertical, diagonal for realism)
    for i in range(grid_size):
        for j in range(grid_size):
            curr = nodes[(i, j)]
            curr_data = G.nodes[curr]

            # Horizontal
            if j + 1 < grid_size:
                nxt = nodes[(i, j+1)]
                nxt_data = G.nodes[nxt]
                dist = haversine(curr_data['lat'], curr_data['lng'],
                                 nxt_data['lat'], nxt_data['lng'])
                # Add slight random variation to simulate real road lengths
                weight = dist * (1 + 0.1 * (hash((curr, nxt)) % 5) / 5)
                G.add_edge(curr, nxt, weight=round(weight, 4))

            # Vertical
            if i + 1 < grid_size:
                nxt = nodes[(i+1, j)]
                nxt_data = G.nodes[nxt]
                dist = haversine(curr_data['lat'], curr_data['lng'],
                                 nxt_data['lat'], nxt_data['lng'])
                weight = dist * (1 + 0.1 * (hash((curr, nxt)) % 5) / 5)
                G.add_edge(curr, nxt, weight=round(weight, 4))

    return G

def find_nearest_node(G: nx.Graph, lat: float, lng: float) -> int:
    """Find the graph node closest to given coordinates."""
    min_dist = float('inf')
    nearest = None
    for node, data in G.nodes(data=True):
        d = haversine(lat, lng, data['lat'], data['lng'])
        if d < min_dist:
            min_dist = d
            nearest = node
    return nearest

def get_path_coordinates(G: nx.Graph, path: List[int]) -> List[List[float]]:
    """Convert a list of node IDs to [lat, lng] coordinates."""
    coords = []
    for node in path:
        data = G.nodes[node]
        coords.append([data['lat'], data['lng']])
    return coords

def calculate_path_distance(G: nx.Graph, path: List[int]) -> float:
    """Calculate total distance of a path in km."""
    total = 0.0
    for i in range(len(path) - 1):
        edge_data = G.get_edge_data(path[i], path[i+1])
        if edge_data:
            total += edge_data['weight']
        else:
            # Fallback to direct haversine
            n1, n2 = G.nodes[path[i]], G.nodes[path[i+1]]
            total += haversine(n1['lat'], n1['lng'], n2['lat'], n2['lng'])
    return round(total, 4)
