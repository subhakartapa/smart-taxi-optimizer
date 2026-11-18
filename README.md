# 🚕 Smart Taxi Route Optimizer

An AI-powered taxi route optimization platform built with React.js, Flask, and graph algorithms (Dijkstra, A*, VRP).

## 🌟 Features

- **Interactive Map** — Leaflet.js + OpenStreetMap + OSRM real road routing
- **Dijkstra's Algorithm** — Guaranteed shortest path with node exploration tracking
- **A* Search** — Heuristic-guided fast pathfinding (Haversine heuristic)
- **Algorithm Comparison** — Side-by-side performance metrics with charts
- **Taxi Management** — Register, track, and assign taxis to routes
- **Multi-Stop VRP** — Vehicle Routing Problem with Nearest Neighbor + 2-opt improvement
- **Trip History** — SQLite-backed trip log with filtering and pagination
- **Dashboard** — Real-time fleet and optimization stats with charts

> ⚠️ **Traffic Data**: Duration estimates are speed-based simulations (30 km/h average). Real-time traffic is NOT integrated.

---

## 🏗️ Project Structure

```
smart-taxi-optimizer/
├── backend/
│   ├── app.py              # Flask entry point
│   ├── database.py         # SQLite models + sample data
│   ├── algorithms/
│   │   ├── dijkstra.py     # Dijkstra's algorithm
│   │   ├── astar.py        # A* Search algorithm
│   │   ├── vrp.py          # VRP + 2-opt solver
│   │   └── graph_builder.py # NetworkX graph utilities
│   ├── routes/
│   │   ├── optimize.py     # Route optimization endpoints
│   │   ├── taxis.py        # Taxi CRUD endpoints
│   │   ├── trips.py        # Trip history endpoints
│   │   └── dashboard.py    # Dashboard stats endpoint
│   └── requirements.txt
│
└── frontend/
    ├── src/
    │   ├── App.jsx
    │   ├── api/client.js   # Axios API client
    │   ├── components/     # Layout, Map, Dashboard, Common
    │   └── pages/          # 6 application pages
    ├── index.html
    └── vite.config.js
```

---

## 🚀 Quick Start

### Prerequisites
- Python 3.9+
- Node.js 18+
- pip

### 1. Backend Setup

```bash
cd backend

# Create virtual environment (recommended)
python -m venv venv
venv\Scripts\activate   # Windows
# source venv/bin/activate  # Linux/Mac

# Install dependencies
pip install -r requirements.txt

# Initialize database with sample data
python database.py

# Start Flask server
python app.py
```

The API will be running at **http://localhost:5000**

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will be at **http://localhost:5173**

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/dashboard/stats` | Dashboard statistics |
| GET | `/api/taxis/` | List all taxis |
| POST | `/api/taxis/` | Register new taxi |
| PUT | `/api/taxis/<id>/status` | Update taxi status |
| DELETE | `/api/taxis/<id>` | Delete taxi |
| POST | `/api/taxis/assign` | Find nearest available taxi |
| POST | `/api/optimize/route` | Optimize single route |
| POST | `/api/optimize/compare` | Compare Dijkstra vs A* |
| POST | `/api/optimize/multistop` | VRP multi-stop optimization |
| GET | `/api/trips/` | Trip history |
| POST | `/api/trips/` | Save trip |

---

## 🧠 Algorithm Details

### Dijkstra's Algorithm
- Uses a **min-heap priority queue** for O((V+E) log V) complexity
- Explores all reachable nodes up to distance d from source
- Guarantees the globally shortest path

### A* Search
- Uses **Haversine distance** as an admissible heuristic (never overestimates)
- f(n) = g(n) + h(n): actual cost + estimated remaining cost
- Typically explores 50-80% fewer nodes than Dijkstra for geographic routing

### VRP Solver
1. **Nearest Neighbor** — greedy initial ordering O(n²)
2. **2-opt improvement** — reverses path segments to remove crossings
3. **Balanced partitioning** — distributes stops evenly across taxis

### Graph Representation
- NetworkX synthetic grid graph: 25×25 nodes, 0.4km spacing
- Built around the center of the route for each request
- Edge weights include slight random variation for realism
- OSRM API provides real road geometry for map display

---

## 📊 Sample Data

The database is pre-loaded with:
- **10 sample taxis** (mix of available/busy/offline) in Delhi, India area
- **20 sample trips** using both Dijkstra and A* algorithms

---

## 🎨 Design

- **Dark theme** with navy blue background (#0F172A)
- **Teal accent** color (#06B6D4)  
- **Inter** + **JetBrains Mono** typography
- Responsive sidebar navigation with collapse support
- Animated stat cards with glassmorphism effects
- Dark map tile layer (CartoDB Dark Matter)
