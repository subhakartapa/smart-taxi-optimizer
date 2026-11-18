import { useState, useCallback, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import { optimizeAPI, tripAPI, taxiAPI } from '../api/client'
import { InlineSpinner } from '../components/Common/LoadingSpinner'
import { ErrorMessage, InfoMessage } from '../components/Common/ErrorMessage'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { MapPin, Navigation, Zap, AlertTriangle, CheckCircle, Car } from 'lucide-react'

// Fix default marker icons
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const pickupIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
})

const dropoffIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
})

function MapClickHandler({ mode, onPickup, onDropoff }) {
  useMapEvents({
    click(e) {
      if (mode === 'pickup') onPickup(e.latlng)
      else if (mode === 'dropoff') onDropoff(e.latlng)
    }
  })
  return null
}

export default function RouteOptimizer() {
  const [pickup, setPickup] = useState(null)
  const [dropoff, setDropoff] = useState(null)
  const [clickMode, setClickMode] = useState('pickup') // 'pickup' | 'dropoff' | null
  const [algorithm, setAlgorithm] = useState('both')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)
  const [assignedTaxi, setAssignedTaxi] = useState(null)
  const [savingTrip, setSavingTrip] = useState(false)

  const handlePickup = useCallback((latlng) => {
    setPickup({ lat: latlng.lat, lng: latlng.lng })
    setClickMode('dropoff')
    setResult(null)
    setError(null)
  }, [])

  const handleDropoff = useCallback((latlng) => {
    setDropoff({ lat: latlng.lat, lng: latlng.lng })
    setClickMode(null)
    setResult(null)
    setError(null)
  }, [])

  const handleOptimize = async () => {
    if (!pickup || !dropoff) {
      setError('Please select both pickup and drop-off locations on the map.')
      return
    }
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const res = await optimizeAPI.route({
        pickup_lat: pickup.lat, pickup_lng: pickup.lng,
        dropoff_lat: dropoff.lat, dropoff_lng: dropoff.lng,
        algorithm,
      })
      setResult(res.data)

      // Auto-assign nearest taxi
      try {
        const taxiRes = await taxiAPI.assign({ pickup_lat: pickup.lat, pickup_lng: pickup.lng })
        setAssignedTaxi(taxiRes.data)
      } catch {}

    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveTrip = async () => {
    if (!result) return
    setSavingTrip(true)
    try {
      const bestAlgo = result.results?.dijkstra || result.results?.astar
      await tripAPI.save({
        taxi_id: assignedTaxi?.taxi?.id || null,
        pickup_lat: pickup.lat, pickup_lng: pickup.lng,
        pickup_name: `${pickup.lat.toFixed(4)}, ${pickup.lng.toFixed(4)}`,
        dropoff_lat: dropoff.lat, dropoff_lng: dropoff.lng,
        dropoff_name: `${dropoff.lat.toFixed(4)}, ${dropoff.lng.toFixed(4)}`,
        distance: bestAlgo?.distance_km || result.comparison?.optimized_distance_km || 0,
        duration: result.comparison?.optimized_duration_min || 0,
        algorithm: Object.keys(result.results || {})[0] || 'dijkstra',
        route_coords: result.osrm_route?.coordinates || bestAlgo?.coordinates || [],
      })
      setError(null)
      alert('✅ Trip saved to history!')
    } catch (e) {
      setError('Failed to save trip: ' + e.message)
    } finally {
      setSavingTrip(false)
    }
  }

  // Build route polylines
  const dijkstraCoords = result?.results?.dijkstra?.coordinates || []
  const astarCoords = result?.results?.astar?.coordinates || []
  const osrmCoords = result?.osrm_route?.coordinates || []

  // Comparison bar chart data
  const compData = result?.comparison ? [
    { name: 'Normal Route', distance: result.comparison.normal_distance_km, duration: result.comparison.normal_duration_min, fill: '#475569' },
    { name: 'Optimized', distance: result.comparison.optimized_distance_km, duration: result.comparison.optimized_duration_min, fill: '#06b6d4' },
  ] : []

  const algoCompData = result?.results ? Object.entries(result.results).map(([key, val]) => ({
    name: key === 'astar' ? 'A* Search' : "Dijkstra's",
    'Nodes Explored': val.nodes_explored,
    'Time (ms)': parseFloat((val.computation_time_ms || 0).toFixed(2)),
    'Distance (km)': parseFloat((val.distance_km || 0).toFixed(3)),
  })) : []

  const mapInstruction = clickMode === 'pickup' ? '🟢 Click map to set Pickup location'
    : clickMode === 'dropoff' ? '🔴 Click map to set Drop-off location'
    : '✅ Both locations set — click Optimize!'

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <h1>Route Optimizer</h1>
        <p>Click on the map to set pickup & drop-off, then run Dijkstra's or A* algorithm</p>
      </div>

      <div className="two-col" style={{ gap: 20, alignItems: 'flex-start' }}>
        {/* Left Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Location Selection */}
          <div className="card">
            <div className="card-title" style={{ marginBottom: 14 }}>Location Selection</div>

            {/* Click mode buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
              <button
                className={`btn ${clickMode === 'pickup' ? 'btn-success' : 'btn-secondary'}`}
                onClick={() => setClickMode(clickMode === 'pickup' ? null : 'pickup')}
              >
                <MapPin size={15} />
                {pickup ? `📍 ${pickup.lat.toFixed(4)}, ${pickup.lng.toFixed(4)}` : 'Set Pickup'}
              </button>
              <button
                className={`btn ${clickMode === 'dropoff' ? 'btn-danger' : 'btn-secondary'}`}
                onClick={() => setClickMode(clickMode === 'dropoff' ? null : 'dropoff')}
              >
                <Navigation size={15} />
                {dropoff ? `📍 ${dropoff.lat.toFixed(4)}, ${dropoff.lng.toFixed(4)}` : 'Set Drop-off'}
              </button>
            </div>

            <InfoMessage message={mapInstruction} />

            {(pickup || dropoff) && (
              <button
                className="btn btn-secondary btn-sm"
                style={{ marginTop: 10 }}
                onClick={() => { setPickup(null); setDropoff(null); setClickMode('pickup'); setResult(null); setAssignedTaxi(null) }}
              >
                Clear Locations
              </button>
            )}
          </div>

          {/* Algorithm Selection */}
          <div className="card">
            <div className="card-title" style={{ marginBottom: 10 }}>Algorithm</div>
            <div className="algo-selector">
              {[
                { value: 'dijkstra', label: "Dijkstra's" },
                { value: 'astar', label: 'A* Search' },
                { value: 'both', label: 'Compare Both' },
              ].map(opt => (
                <button
                  key={opt.value}
                  className={`algo-btn ${algorithm === opt.value ? 'selected' : ''}`}
                  onClick={() => setAlgorithm(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <button
              id="optimize-btn"
              className="btn btn-primary btn-full btn-lg"
              onClick={handleOptimize}
              disabled={loading || !pickup || !dropoff}
            >
              {loading ? <><InlineSpinner /> Optimizing...</> : <><Zap size={16} /> Optimize Route</>}
            </button>
          </div>

          {/* Error */}
          {error && <ErrorMessage message={error} />}

          {/* Results */}
          {result && (
            <>
              {/* Comparison Summary */}
              <div className="card">
                <div className="card-title" style={{ marginBottom: 12 }}>Route Comparison</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                  {[
                    { label: 'Normal Distance', value: `${result.comparison.normal_distance_km} km`, sub: `${result.comparison.normal_duration_min} min`, color: '#64748b' },
                    { label: 'Optimized Distance', value: `${result.comparison.optimized_distance_km} km`, sub: `${result.comparison.optimized_duration_min} min`, color: '#06b6d4' },
                    { label: 'Distance Saved', value: `${result.comparison.distance_saved_km} km`, color: '#10b981' },
                    { label: 'Time Saved', value: `${result.comparison.time_saved_min} min`, color: '#f59e0b' },
                  ].map((item, i) => (
                    <div key={i} style={{ background: 'var(--bg-secondary)', borderRadius: 10, padding: 12 }}>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase' }}>
                        {item.label}
                      </div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: item.color, fontFamily: 'JetBrains Mono' }}>
                        {item.value}
                      </div>
                      {item.sub && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.sub}</div>}
                    </div>
                  ))}
                </div>

                {/* Comparison bar chart */}
                {compData.length > 0 && (
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart data={compData} barSize={36}>
                      <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                      <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                      <Tooltip contentStyle={{ background: '#111827', border: '1px solid #1e293b', borderRadius: 8, fontSize: 12 }} />
                      <Bar dataKey="distance" name="Distance (km)" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}

                {/* Traffic note */}
                <div style={{ marginTop: 10, fontSize: 11.5, color: '#f59e0b', display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                  <AlertTriangle size={13} style={{ flexShrink: 0, marginTop: 1 }} />
                  <span>{result.traffic_note}</span>
                </div>
              </div>

              {/* Algorithm Comparison (if both) */}
              {algoCompData.length > 1 && (
                <div className="card">
                  <div className="card-title" style={{ marginBottom: 12 }}>Algorithm Performance</div>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={algoCompData} barSize={28}>
                      <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                      <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                      <Tooltip contentStyle={{ background: '#111827', border: '1px solid #1e293b', borderRadius: 8, fontSize: 12 }} />
                      <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
                      <Bar dataKey="Nodes Explored" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                      <Bar dataKey="Time (ms)" fill="#8b5cf6" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>

                  {/* Per-algorithm details */}
                  {Object.entries(result.results).map(([algo, r]) => (
                    <div key={algo} style={{
                      background: 'var(--bg-secondary)', borderRadius: 10, padding: 12, marginTop: 10
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span className={`badge badge-${algo}`}>{algo === 'astar' ? 'A* Search' : "Dijkstra's"}</span>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{r.description?.substring(0, 60)}...</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                        {[
                          { label: 'Distance', value: `${r.distance_km} km` },
                          { label: 'Nodes', value: r.nodes_explored },
                          { label: 'Time', value: `${r.computation_time_ms}ms` },
                        ].map((item, i) => (
                          <div key={i}>
                            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>{item.label}</div>
                            <div style={{ fontSize: 15, fontWeight: 700, fontFamily: 'JetBrains Mono', color: 'var(--text-primary)' }}>{item.value}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Assigned Taxi */}
              {assignedTaxi && (
                <div className="card" style={{ border: '1px solid rgba(16,185,129,0.2)', background: 'rgba(16,185,129,0.03)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <Car size={16} color="#10b981" />
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#10b981' }}>Nearest Taxi Assigned</span>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                    {assignedTaxi.taxi.name} — {assignedTaxi.taxi.driver_name}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                    {assignedTaxi.distance_km} km away · ETA: {assignedTaxi.eta_minutes} min
                  </div>
                </div>
              )}

              {/* Save Trip Button */}
              <button className="btn btn-success btn-full" onClick={handleSaveTrip} disabled={savingTrip}>
                {savingTrip ? <><InlineSpinner /> Saving...</> : <><CheckCircle size={15} /> Save Trip to History</>}
              </button>
            </>
          )}
        </div>

        {/* Right Panel - Map */}
        <div style={{ position: 'sticky', top: 0 }}>
          <div className="map-container" style={{ position: 'relative' }}>
            <MapContainer
              center={[28.6139, 77.2090]}
              zoom={12}
              style={{ height: '75vh', width: '100%' }}
              id="route-map"
            >
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>'
              />
              <MapClickHandler mode={clickMode} onPickup={handlePickup} onDropoff={handleDropoff} />

              {pickup && (
                <Marker position={[pickup.lat, pickup.lng]} icon={pickupIcon}>
                  <Popup>
                    <strong>🟢 Pickup</strong><br />
                    {pickup.lat.toFixed(5)}, {pickup.lng.toFixed(5)}
                  </Popup>
                </Marker>
              )}

              {dropoff && (
                <Marker position={[dropoff.lat, dropoff.lng]} icon={dropoffIcon}>
                  <Popup>
                    <strong>🔴 Drop-off</strong><br />
                    {dropoff.lat.toFixed(5)}, {dropoff.lng.toFixed(5)}
                  </Popup>
                </Marker>
              )}

              {/* OSRM real road route */}
              {osrmCoords.length > 0 && (
                <Polyline positions={osrmCoords} color="#f59e0b" weight={5} opacity={0.85} dashArray="8,4"
                  pathOptions={{ lineCap: 'round', lineJoin: 'round' }} />
              )}

              {/* Dijkstra route (graph-based) */}
              {dijkstraCoords.length > 0 && (
                <Polyline positions={dijkstraCoords} color="#3b82f6" weight={4} opacity={0.75} />
              )}

              {/* A* route (graph-based) */}
              {astarCoords.length > 0 && (
                <Polyline positions={astarCoords} color="#8b5cf6" weight={3} opacity={0.75} dashArray="5,3" />
              )}
            </MapContainer>

            {/* Map instruction overlay */}
            {clickMode && (
              <div className="map-instructions">
                {clickMode === 'pickup' ? '🟢 Click to set Pickup' : '🔴 Click to set Drop-off'}
              </div>
            )}

            {/* Legend */}
            <div style={{
              position: 'absolute', bottom: 12, left: 12, zIndex: 1000,
              background: 'rgba(10,15,30,0.9)', border: '1px solid var(--border-light)',
              borderRadius: 8, padding: '8px 12px', backdropFilter: 'blur(8px)'
            }}>
              <div className="legend">
                {osrmCoords.length > 0 && <div className="legend-item"><div className="legend-line" style={{ background: '#f59e0b', borderTop: '2px dashed #f59e0b', background: 'none' }} /><span>OSRM Road</span></div>}
                {dijkstraCoords.length > 0 && <div className="legend-item"><div className="legend-line" style={{ background: '#3b82f6' }} /><span>Dijkstra</span></div>}
                {astarCoords.length > 0 && <div className="legend-item"><div className="legend-line" style={{ background: '#8b5cf6' }} /><span>A*</span></div>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
