import { GitBranch, Zap, Route, Car, Database, Globe, AlertTriangle, CheckCircle } from 'lucide-react'

const algorithms = [
  {
    name: "Dijkstra's Algorithm",
    icon: GitBranch,
    color: '#3b82f6',
    badge: 'Shortest Path',
    complexity: { time: 'O((V + E) log V)', space: 'O(V)' },
    description: `Dijkstra's algorithm is a classic graph shortest-path algorithm invented by computer scientist Edsger W. Dijkstra in 1956. It finds the shortest path from a source node to all other nodes in a weighted graph with non-negative edge weights.`,
    howItWorks: [
      'Initialize all distances to infinity, source distance to 0',
      'Use a min-heap priority queue to always process the nearest unvisited node',
      'For each neighboring node, relax its distance if a shorter path is found',
      'Continue until the target node is reached or all nodes are processed',
      'Reconstruct the path by tracing back through "previous" pointers',
    ],
    pros: ['Guaranteed optimal (shortest) path', 'Simple to implement', 'Works on any weighted graph'],
    cons: ['Explores all nodes up to target — may be slow for large graphs', 'No heuristic to guide direction', 'O((V+E) log V) time complexity'],
  },
  {
    name: 'A* Search Algorithm',
    icon: Zap,
    color: '#8b5cf6',
    badge: 'Heuristic Search',
    complexity: { time: 'O(E) best case', space: 'O(V)' },
    description: `A* (pronounced "A-star") is an informed search algorithm that extends Dijkstra's approach by using a heuristic function h(n) to estimate the remaining cost to the goal. This makes it significantly faster in practice by focusing the search toward the destination.`,
    howItWorks: [
      'f(n) = g(n) + h(n) where g(n) = actual cost, h(n) = heuristic estimate',
      'Heuristic used: Haversine distance (great-circle distance) to target — always admissible',
      'Nodes with lower f-scores are explored first — goal-directed search',
      'Guaranteed optimal path as long as heuristic never overestimates',
      'Typically explores far fewer nodes than Dijkstra for geographic routing',
    ],
    pros: ['Much faster than Dijkstra in practice', 'Optimal path with admissible heuristic', 'Flexible: heuristic can be tuned'],
    cons: ['Requires a good heuristic function', 'If heuristic is poor, degrades to Dijkstra', 'More complex implementation'],
  },
  {
    name: 'Nearest Neighbor Heuristic',
    icon: Route,
    color: '#f59e0b',
    badge: 'VRP Initial Solution',
    complexity: { time: 'O(n²)', space: 'O(n)' },
    description: 'The Nearest Neighbor heuristic is a greedy algorithm for the Travelling Salesman Problem (TSP) and Vehicle Routing Problem (VRP). It builds an initial tour by always visiting the closest unvisited location next.',
    howItWorks: [
      'Start at the first stop',
      'Find the nearest unvisited stop using Haversine distance',
      'Visit that stop and mark it as visited',
      'Repeat until all stops are visited',
      'The resulting order is used as the initial VRP solution for 2-opt improvement',
    ],
    pros: ['Very fast — O(n²)', 'Good starting point for local search', 'Simple to understand'],
    cons: ['Not optimal — can produce routes ~20-25% longer than optimal', 'Sensitive to starting point', 'Can create "zigzag" paths'],
  },
  {
    name: 'Vehicle Routing Problem (VRP) + 2-opt',
    icon: Car,
    color: '#10b981',
    badge: 'Multi-Vehicle Optimization',
    complexity: { time: 'O(n² × iterations)', space: 'O(n)' },
    description: 'The Vehicle Routing Problem generalizes TSP to multiple vehicles. Our solution uses Nearest Neighbor for initial ordering, then applies 2-opt local search improvement, and finally distributes stops across available taxis.',
    howItWorks: [
      'Step 1: Run Nearest Neighbor to get initial stop ordering',
      'Step 2: Apply 2-opt: repeatedly reverse sub-sequences to reduce crossing paths',
      'Step 3: If distance decreases, accept the reversal; continue until no improvement',
      'Step 4: Balance stops across available taxis (stops_per_taxi = ceil(n/taxis))',
      'Step 5: Calculate each taxi\'s route distance from its starting location',
    ],
    pros: ['Significantly improves on initial NN solution', '2-opt guarantees no crossing paths in final tour', 'Scales to multiple vehicles'],
    cons: ['2-opt finds local optimum, not necessarily global', 'For large n, many iterations needed', 'Simple partitioning — not full VRP optimization'],
  },
]

export default function About() {
  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <h1>About This Project</h1>
        <p>Smart Taxi Route Optimizer — algorithms, architecture, and design decisions</p>
      </div>

      {/* Project Overview */}
      <div className="card" style={{ marginBottom: 24, background: 'linear-gradient(135deg, rgba(6,182,212,0.07), rgba(59,130,246,0.04))' }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          <div style={{ width: 50, height: 50, background: 'rgba(6,182,212,0.15)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Zap size={24} color="#06b6d4" />
          </div>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
              Smart Taxi Route Optimizer
            </h2>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              An AI-powered taxi dispatch and route optimization system built with React.js, Flask, NetworkX, and Leaflet.js.
              The system uses graph algorithms to find optimal routes, reduces travel distance, and assigns taxis efficiently.
              All route calculations use real algorithm implementations — no hardcoded results.
            </p>
          </div>
        </div>
      </div>

      {/* Tech Stack */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-title" style={{ marginBottom: 16 }}>Technology Stack</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          {[
            { category: 'Frontend', items: ['React.js', 'Tailwind CSS', 'Leaflet.js / OpenStreetMap', 'Recharts', 'Axios'], color: '#06b6d4' },
            { category: 'Backend', items: ['Python 3', 'Flask 3', 'Flask-CORS', 'REST API'], color: '#3b82f6' },
            { category: 'Algorithms', items: ['NetworkX', 'Dijkstra\'s Algorithm', 'A* Search', 'VRP + 2-opt', 'Nearest Neighbor'], color: '#8b5cf6' },
            { category: 'Database', items: ['SQLite', 'Custom ORM layer', 'Sample dataset (10 taxis, 20 trips)'], color: '#10b981' },
            { category: 'Routing', items: ['OSRM Public API', 'Haversine formula', 'Grid graph (NetworkX)', 'Real road geometry'], color: '#f59e0b' },
          ].map((stack, i) => (
            <div key={i} style={{ background: 'var(--bg-secondary)', borderRadius: 10, padding: 14, borderLeft: `3px solid ${stack.color}` }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: stack.color, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
                {stack.category}
              </div>
              {stack.items.map((item, j) => (
                <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-secondary)', padding: '3px 0' }}>
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: stack.color }} />
                  {item}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Important disclaimer */}
      <div style={{
        background: 'rgba(245,158,11,0.08)',
        border: '1px solid rgba(245,158,11,0.3)',
        borderRadius: 12, padding: 16, marginBottom: 24,
        display: 'flex', gap: 12, alignItems: 'flex-start'
      }}>
        <AlertTriangle size={18} color="#f59e0b" style={{ flexShrink: 0, marginTop: 2 }} />
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#f59e0b', marginBottom: 6 }}>Traffic Data Disclaimer</div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            Duration estimates shown in this application are <strong>speed-based simulations</strong> (using an assumed average speed of 30 km/h in urban areas).
            <strong> Real-time traffic data is NOT integrated</strong>. For real-time traffic, an API provider such as Google Maps Platform, HERE Maps, or TomTom would be required.
            Geographic routing (road geometry) uses the OSRM public routing engine which provides real road paths but not live traffic.
          </p>
        </div>
      </div>

      {/* Algorithm Cards */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>
          Optimization Algorithms
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {algorithms.map((algo, i) => {
            const Icon = algo.icon
            return (
              <div key={i} className="card fade-in" style={{ borderLeft: `3px solid ${algo.color}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 42, height: 42, background: `${algo.color}22`, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={20} color={algo.color} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{algo.name}</h3>
                      <span style={{ fontSize: 11, background: `${algo.color}22`, color: algo.color, padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>
                        {algo.badge}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <div style={{ background: 'var(--bg-secondary)', borderRadius: 8, padding: '6px 12px', fontSize: 12 }}>
                      <span style={{ color: 'var(--text-muted)' }}>Time: </span>
                      <span style={{ fontFamily: 'JetBrains Mono', color: algo.color }}>{algo.complexity.time}</span>
                    </div>
                    <div style={{ background: 'var(--bg-secondary)', borderRadius: 8, padding: '6px 12px', fontSize: 12 }}>
                      <span style={{ color: 'var(--text-muted)' }}>Space: </span>
                      <span style={{ fontFamily: 'JetBrains Mono', color: algo.color }}>{algo.complexity.space}</span>
                    </div>
                  </div>
                </div>

                <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 14 }}>
                  {algo.description}
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 14 }}>
                  {/* How it works */}
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                      How It Works
                    </div>
                    {algo.howItWorks.map((step, j) => (
                      <div key={j} style={{ display: 'flex', gap: 8, marginBottom: 6, alignItems: 'flex-start' }}>
                        <div style={{ width: 20, height: 20, background: `${algo.color}22`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: algo.color, fontWeight: 700, flexShrink: 0 }}>
                          {j + 1}
                        </div>
                        <span style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{step}</span>
                      </div>
                    ))}
                  </div>

                  {/* Pros */}
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                      Advantages
                    </div>
                    {algo.pros.map((p, j) => (
                      <div key={j} style={{ display: 'flex', gap: 6, marginBottom: 6, alignItems: 'flex-start' }}>
                        <CheckCircle size={12} color="#10b981" style={{ flexShrink: 0, marginTop: 2 }} />
                        <span style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{p}</span>
                      </div>
                    ))}
                  </div>

                  {/* Cons */}
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                      Limitations
                    </div>
                    {algo.cons.map((c, j) => (
                      <div key={j} style={{ display: 'flex', gap: 6, marginBottom: 6, alignItems: 'flex-start' }}>
                        <AlertTriangle size={12} color="#ef4444" style={{ flexShrink: 0, marginTop: 2 }} />
                        <span style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{c}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Architecture */}
      <div className="card">
        <div className="card-title" style={{ marginBottom: 14 }}>System Architecture</div>
        <div style={{ background: 'var(--bg-secondary)', borderRadius: 10, padding: 20, fontFamily: 'JetBrains Mono', fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 2 }}>
          <div><span style={{ color: '#06b6d4' }}>Frontend (React + Vite)</span></div>
          <div style={{ paddingLeft: 20 }}>→ Leaflet.js (Interactive Map)</div>
          <div style={{ paddingLeft: 20 }}>→ Recharts (Algorithm Comparison Charts)</div>
          <div style={{ paddingLeft: 20 }}>→ Axios (REST API calls to Flask)</div>
          <br />
          <div><span style={{ color: '#3b82f6' }}>Backend (Flask REST API)</span></div>
          <div style={{ paddingLeft: 20 }}>→ /api/optimize/route    — Dijkstra / A* on NetworkX graph</div>
          <div style={{ paddingLeft: 20 }}>→ /api/optimize/multistop — VRP solver</div>
          <div style={{ paddingLeft: 20 }}>→ /api/taxis/            — Taxi CRUD + assignment</div>
          <div style={{ paddingLeft: 20 }}>→ /api/trips/            — Trip history (SQLite)</div>
          <div style={{ paddingLeft: 20 }}>→ /api/dashboard/stats  — Aggregated metrics</div>
          <br />
          <div><span style={{ color: '#8b5cf6' }}>Algorithm Layer</span></div>
          <div style={{ paddingLeft: 20 }}>→ NetworkX synthetic grid graph (25×25, 0.4km spacing)</div>
          <div style={{ paddingLeft: 20 }}>→ OSRM Public API (real road geometry)</div>
          <div style={{ paddingLeft: 20 }}>→ Haversine formula (great-circle distance)</div>
          <br />
          <div><span style={{ color: '#10b981' }}>Database (SQLite)</span></div>
          <div style={{ paddingLeft: 20 }}>→ taxis table (10 sample taxis)</div>
          <div style={{ paddingLeft: 20 }}>→ trips table (20 sample trips + user trips)</div>
        </div>
      </div>
    </div>
  )
}
