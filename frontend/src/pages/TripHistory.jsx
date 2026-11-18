import { useState, useEffect } from 'react'
import { tripAPI } from '../api/client'
import { LoadingSpinner } from '../components/Common/LoadingSpinner'
import { ErrorMessage } from '../components/Common/ErrorMessage'
import { History, MapPin, Clock, Navigation, ChevronLeft, ChevronRight, Filter } from 'lucide-react'

function AlgoBadge({ algorithm }) {
  const cls = algorithm === 'astar' ? 'badge-astar' : algorithm === 'dijkstra' ? 'badge-dijkstra' : 'badge-vrp'
  const label = algorithm === 'astar' ? 'A*' : algorithm === 'dijkstra' ? "Dijkstra's" : algorithm
  return <span className={`badge ${cls}`}>{label}</span>
}

export default function TripHistory() {
  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [filterAlgo, setFilterAlgo] = useState('')

  const fetchTrips = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = { page, per_page: 15 }
      if (filterAlgo) params.algorithm = filterAlgo
      const res = await tripAPI.getAll(params)
      setTrips(res.data.trips)
      setTotalPages(res.data.total_pages)
      setTotal(res.data.total)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchTrips() }, [page, filterAlgo])

  const totalDist = trips.reduce((sum, t) => sum + (t.distance || 0), 0)
  const avgDist = trips.length ? totalDist / trips.length : 0

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <h1>Trip History</h1>
        <p>Complete log of all optimized routes — {total} trips recorded</p>
      </div>

      {/* Summary row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 20 }}>
        {[
          { label: 'Total Trips (page)', value: trips.length, icon: History, color: '#06b6d4' },
          { label: 'Total Distance (page)', value: `${totalDist.toFixed(1)} km`, icon: Navigation, color: '#10b981' },
          { label: 'Avg Distance (page)', value: `${avgDist.toFixed(1)} km`, icon: MapPin, color: '#f59e0b' },
        ].map((item, i) => (
          <div key={i} className="card" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 16 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: `${item.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <item.icon size={18} color={item.color} />
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, fontFamily: 'JetBrains Mono', color: item.color }}>{item.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
        <Filter size={14} color="var(--text-muted)" />
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Filter by algorithm:</span>
        {['', 'dijkstra', 'astar'].map(val => (
          <button
            key={val || 'all'}
            id={`filter-${val || 'all'}`}
            className={`btn btn-sm ${filterAlgo === val ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => { setFilterAlgo(val); setPage(1) }}
          >
            {val === '' ? 'All' : val === 'astar' ? 'A* Search' : "Dijkstra's"}
          </button>
        ))}
      </div>

      {error && <div style={{ marginBottom: 16 }}><ErrorMessage message={error} /></div>}

      {loading ? (
        <LoadingSpinner text="Loading trip history..." />
      ) : trips.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          <History size={48} style={{ marginBottom: 12, opacity: 0.3 }} />
          <div style={{ fontSize: 16, fontWeight: 600 }}>No trips found</div>
          <div style={{ fontSize: 13, marginTop: 6 }}>
            {filterAlgo ? 'Try changing the filter.' : 'Complete a route optimization to see it here.'}
          </div>
        </div>
      ) : (
        <>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Taxi</th>
                  <th>Pickup</th>
                  <th>Drop-off</th>
                  <th>Distance</th>
                  <th>Duration</th>
                  <th>Algorithm</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {trips.map((trip, i) => (
                  <tr key={trip.id}>
                    <td style={{ color: 'var(--text-muted)', fontFamily: 'JetBrains Mono', fontSize: 12 }}>
                      {(page - 1) * 15 + i + 1}
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'JetBrains Mono', fontSize: 13 }}>
                        {trip.taxi_name || '—'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981', flexShrink: 0 }} />
                        <span style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 13 }}>
                          {trip.pickup_name || `${trip.pickup_lat?.toFixed(3)}, ${trip.pickup_lng?.toFixed(3)}`}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#ef4444', flexShrink: 0 }} />
                        <span style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 13 }}>
                          {trip.dropoff_name || `${trip.dropoff_lat?.toFixed(3)}, ${trip.dropoff_lng?.toFixed(3)}`}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'JetBrains Mono', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {(trip.distance || 0).toFixed(2)} km
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Clock size={12} color="var(--text-muted)" />
                        <span style={{ fontFamily: 'JetBrains Mono', fontSize: 13 }}>
                          {(trip.duration || 0).toFixed(1)} min
                        </span>
                      </div>
                    </td>
                    <td><AlgoBadge algorithm={trip.algorithm} /></td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {new Date(trip.created_at).toLocaleDateString('en-IN', {
                        day: '2-digit', month: 'short', year: 'numeric'
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 20 }}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft size={14} /> Prev
              </button>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                Page {page} of {totalPages}
              </span>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
