import { useEffect, useState } from 'react'
import { Car, CheckCircle, MapPin, TrendingUp, Clock, Navigation, Zap, Users } from 'lucide-react'
import { dashboardAPI } from '../api/client'
import StatCard from '../components/Dashboard/StatCard'
import { LoadingSpinner } from '../components/Common/LoadingSpinner'
import { ErrorMessage } from '../components/Common/ErrorMessage'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts'

const ALGO_COLORS = { dijkstra: '#3b82f6', astar: '#8b5cf6', other: '#06b6d4' }

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchStats = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await dashboardAPI.getStats()
      setStats(res.data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchStats() }, [])

  if (loading) return <LoadingSpinner size="lg" text="Loading dashboard..." />
  if (error) return (
    <div className="page-container">
      <ErrorMessage message={error} />
      <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={fetchStats}>Retry</button>
    </div>
  )
  if (!stats) return null

  const { taxis, trips, optimization, recent_trips, top_taxis } = stats

  const algoData = [
    { name: "Dijkstra's", value: trips.dijkstra_trips, color: '#3b82f6' },
    { name: 'A* Search', value: trips.astar_trips, color: '#8b5cf6' },
    { name: 'Other', value: Math.max(0, trips.total - trips.dijkstra_trips - trips.astar_trips), color: '#06b6d4' },
  ].filter(d => d.value > 0)

  const taxiStatusData = [
    { name: 'Available', value: taxis.available, color: '#10b981' },
    { name: 'Busy', value: taxis.busy, color: '#f59e0b' },
    { name: 'Offline', value: taxis.offline, color: '#475569' },
  ].filter(d => d.value > 0)

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <h1>Operations Dashboard</h1>
        <p>Real-time overview of taxi fleet and route optimization performance</p>
      </div>

      {/* Stat Cards */}
      <div className="stats-grid">
        <StatCard icon={Car} label="Total Taxis" value={taxis.total} color="cyan" trend="Fleet size" />
        <StatCard icon={CheckCircle} label="Available" value={taxis.available} color="green" trend="Ready for dispatch" trendDir="up" />
        <StatCard icon={Navigation} label="Total Trips" value={trips.total} color="blue" trend="Completed" trendDir="up" />
        <StatCard icon={MapPin} label="Total Distance" value={(trips.total_distance_km || 0).toFixed(1)} unit="km" color="amber" />
        <StatCard icon={TrendingUp} label="Avg Distance" value={(trips.avg_distance_km || 0).toFixed(1)} unit="km" color="purple" />
        <StatCard icon={Clock} label="Time Saved" value={(optimization.estimated_time_saved_min || 0).toFixed(0)} unit="min" color="green" trend="Via optimization" trendDir="up" />
      </div>

      {/* Charts Row */}
      <div className="two-col" style={{ marginBottom: 24 }}>
        {/* Algorithm Usage Pie */}
        <div className="card">
          <div className="card-title">Algorithm Usage</div>
          {algoData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={algoData} cx="50%" cy="50%" innerRadius={55} outerRadius={80}
                  paddingAngle={3} dataKey="value">
                  {algoData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#111827', border: '1px solid #1e293b', borderRadius: 8, fontSize: 13 }}
                  labelStyle={{ color: '#f1f5f9' }}
                />
                <Legend iconType="circle" iconSize={8}
                  wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              No trip data yet. Run some routes!
            </div>
          )}
        </div>

        {/* Taxi Status Pie */}
        <div className="card">
          <div className="card-title">Taxi Fleet Status</div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={taxiStatusData} cx="50%" cy="50%" innerRadius={55} outerRadius={80}
                paddingAngle={3} dataKey="value">
                {taxiStatusData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: '#111827', border: '1px solid #1e293b', borderRadius: 8, fontSize: 13 }}
              />
              <Legend iconType="circle" iconSize={8}
                wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Taxis + Recent Trips */}
      <div className="two-col" style={{ marginBottom: 24 }}>
        {/* Top Taxis */}
        <div className="card">
          <div className="card-title" style={{ marginBottom: 14 }}>Top Taxis by Trips</div>
          {top_taxis.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>No data yet.</div>
          ) : (
            top_taxis.map((taxi, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 0', borderBottom: i < top_taxis.length - 1 ? '1px solid var(--border)' : 'none'
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: i === 0 ? 'rgba(245,158,11,0.15)' : 'rgba(6,182,212,0.08)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 700, color: i === 0 ? '#f59e0b' : '#06b6d4'
                }}>#{i + 1}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)' }}>{taxi.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{taxi.driver_name}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'JetBrains Mono' }}>
                    {taxi.total_trips}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>trips</div>
                </div>
                <span className={`badge badge-${taxi.status}`}>{taxi.status}</span>
              </div>
            ))
          )}
        </div>

        {/* Recent Trips */}
        <div className="card">
          <div className="card-title" style={{ marginBottom: 14 }}>Recent Trips</div>
          {recent_trips.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>No trips yet.</div>
          ) : (
            recent_trips.map((trip, i) => (
              <div key={i} style={{
                padding: '10px 0',
                borderBottom: i < recent_trips.length - 1 ? '1px solid var(--border)' : 'none'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>
                      {trip.pickup_name || 'Unknown'} → {trip.dropoff_name || 'Unknown'}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {trip.taxi_name && `${trip.taxi_name} · `}
                      {new Date(trip.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', marginLeft: 12 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, fontFamily: 'JetBrains Mono', color: 'var(--text-primary)' }}>
                      {trip.distance?.toFixed(1)} km
                    </div>
                    <span className={`badge badge-${trip.algorithm}`} style={{ marginTop: 4 }}>
                      {trip.algorithm === 'astar' ? 'A*' : trip.algorithm}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Optimization savings summary */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, rgba(6,182,212,0.08), rgba(59,130,246,0.05))',
        border: '1px solid rgba(6,182,212,0.2)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <Zap size={20} color="#06b6d4" />
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
            Optimization Performance Summary
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {[
            { label: 'Est. Distance Saved', value: `${optimization.estimated_distance_saved_km?.toFixed(1) || 0} km`, color: '#10b981' },
            { label: 'Est. Time Saved', value: `${optimization.estimated_time_saved_min?.toFixed(0) || 0} min`, color: '#f59e0b' },
            { label: 'Avg Trip Distance', value: `${trips.avg_distance_km?.toFixed(1) || 0} km`, color: '#8b5cf6' },
          ].map((item, i) => (
            <div key={i} style={{ textAlign: 'center', padding: 16, background: 'rgba(0,0,0,0.2)', borderRadius: 10 }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: item.color, fontFamily: 'JetBrains Mono' }}>
                {item.value}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{item.label}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 12, fontSize: 11.5, color: 'var(--text-muted)', fontStyle: 'italic' }}>
          ⚠️ Savings estimates are based on simulated optimization vs. non-optimized routing. Not real-time traffic data.
        </div>
      </div>
    </div>
  )
}
