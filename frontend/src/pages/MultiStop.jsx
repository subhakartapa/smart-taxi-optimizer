import { useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import { optimizeAPI } from '../api/client'
import { InlineSpinner } from '../components/Common/LoadingSpinner'
import { ErrorMessage, InfoMessage } from '../components/Common/ErrorMessage'
import { Plus, Trash2, Route, Zap, Car, AlertTriangle } from 'lucide-react'

// Fix icons
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const STOP_COLORS = ['#06b6d4', '#10b981', '#f59e0b', '#8b5cf6', '#3b82f6', '#ef4444', '#ec4899', '#14b8a6']
const TAXI_COLORS = ['#06b6d4', '#10b981', '#f59e0b', '#8b5cf6', '#3b82f6']

function StopIcon(index) {
  const color = STOP_COLORS[index % STOP_COLORS.length]
  return L.divIcon({
    html: `<div style="background:${color};width:28px;height:28px;border-radius:50%;border:3px solid white;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;color:white;box-shadow:0 2px 8px rgba(0,0,0,0.5)">${index + 1}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    className: '',
  })
}

function MapStopHandler({ addingStop, onAdd }) {
  useMapEvents({
    click(e) {
      if (addingStop) onAdd(e.latlng)
    }
  })
  return null
}

export default function MultiStop() {
  const [stops, setStops] = useState([])
  const [addingStop, setAddingStop] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)
  const [manualStop, setManualStop] = useState({ name: '', lat: '', lng: '' })

  const handleMapClick = (latlng) => {
    const stop = {
      lat: latlng.lat,
      lng: latlng.lng,
      name: `Stop ${stops.length + 1} (${latlng.lat.toFixed(3)}, ${latlng.lng.toFixed(3)})`
    }
    setStops(prev => [...prev, stop])
    setResult(null)
  }

  const handleManualAdd = (e) => {
    e.preventDefault()
    const lat = parseFloat(manualStop.lat)
    const lng = parseFloat(manualStop.lng)
    if (isNaN(lat) || isNaN(lng)) { setError('Invalid coordinates'); return }
    setStops(prev => [...prev, {
      lat, lng,
      name: manualStop.name || `Stop ${stops.length + 1}`
    }])
    setManualStop({ name: '', lat: '', lng: '' })
    setResult(null)
    setError(null)
  }

  const addSampleStops = () => {
    setStops([
      { lat: 28.6139, lng: 77.2090, name: 'Connaught Place' },
      { lat: 28.6562, lng: 77.2410, name: 'Chandni Chowk' },
      { lat: 28.5355, lng: 77.3910, name: 'Noida Sector 18' },
      { lat: 28.5244, lng: 77.1855, name: 'Saket' },
      { lat: 28.6448, lng: 77.0945, name: 'Pitampura' },
    ])
    setResult(null)
  }

  const handleSolve = async () => {
    if (stops.length < 2) {
      setError('Add at least 2 stops to optimize.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await optimizeAPI.multistop({ stops })
      setResult(res.data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <h1>Multi-Stop VRP Optimizer</h1>
        <p>Add multiple stops and use Nearest Neighbor + 2-opt to find the optimal visiting order across taxis</p>
      </div>

      <div className="two-col" style={{ gap: 20, alignItems: 'flex-start' }}>
        {/* Left Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Stop Controls */}
          <div className="card">
            <div className="card-title" style={{ marginBottom: 12 }}>Stop Management</div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
              <button
                className={`btn ${addingStop ? 'btn-success' : 'btn-secondary'}`}
                onClick={() => setAddingStop(!addingStop)}
              >
                <Plus size={15} /> {addingStop ? 'Click Map to Add' : 'Add via Map'}
              </button>
              <button className="btn btn-secondary" onClick={addSampleStops}>
                Load Sample Stops
              </button>
            </div>

            {addingStop && <InfoMessage message="🗺️ Click anywhere on the map to add a stop" />}

            {/* Manual input */}
            <form onSubmit={handleManualAdd} style={{ marginTop: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Add Stop Manually
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 6, marginBottom: 8 }}>
                <input
                  className="form-input"
                  value={manualStop.name}
                  onChange={e => setManualStop({ ...manualStop, name: e.target.value })}
                  placeholder="Stop name"
                  style={{ fontSize: 12 }}
                />
                <input
                  className="form-input"
                  type="number"
                  step="any"
                  value={manualStop.lat}
                  onChange={e => setManualStop({ ...manualStop, lat: e.target.value })}
                  placeholder="Lat"
                  style={{ fontSize: 12 }}
                />
                <input
                  className="form-input"
                  type="number"
                  step="any"
                  value={manualStop.lng}
                  onChange={e => setManualStop({ ...manualStop, lng: e.target.value })}
                  placeholder="Lng"
                  style={{ fontSize: 12 }}
                />
              </div>
              <button type="submit" className="btn btn-secondary btn-sm btn-full">
                <Plus size={12} /> Add Stop
              </button>
            </form>
          </div>

          {/* Stop List */}
          {stops.length > 0 && (
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div className="card-title">{stops.length} Stop{stops.length !== 1 ? 's' : ''}</div>
                <button className="btn btn-danger btn-sm" onClick={() => { setStops([]); setResult(null) }}>
                  Clear All
                </button>
              </div>
              <ul className="stop-list">
                {stops.map((stop, i) => (
                  <li key={i} className="stop-item">
                    <div className="stop-num" style={{ background: `${STOP_COLORS[i % STOP_COLORS.length]}22`, borderColor: `${STOP_COLORS[i % STOP_COLORS.length]}44`, color: STOP_COLORS[i % STOP_COLORS.length] }}>
                      {i + 1}
                    </div>
                    <div className="stop-info">
                      <div className="stop-name">{stop.name}</div>
                      <div className="stop-coords">{stop.lat.toFixed(4)}, {stop.lng.toFixed(4)}</div>
                    </div>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => { setStops(prev => prev.filter((_, idx) => idx !== i)); setResult(null) }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Error */}
          {error && <ErrorMessage message={error} />}

          {/* Solve Button */}
          <button
            id="solve-vrp-btn"
            className="btn btn-primary btn-full btn-lg"
            onClick={handleSolve}
            disabled={loading || stops.length < 2}
          >
            {loading ? <><InlineSpinner /> Solving VRP...</> : <><Zap size={16} /> Solve VRP</>}
          </button>

          {/* Results */}
          {result && (
            <div className="card fade-in" style={{ border: '1px solid rgba(6,182,212,0.25)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <Route size={16} color="#06b6d4" />
                <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>VRP Solution</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 14 }}>
                {[
                  { label: 'Total Distance', value: `${result.total_distance_km} km`, color: '#06b6d4' },
                  { label: 'Taxis Used', value: result.taxis_used, color: '#10b981' },
                  { label: 'NN Distance', value: `${result.nn_distance_km} km`, color: '#94a3b8' },
                  { label: 'Improvement', value: `${result.improvement_percent}%`, color: '#f59e0b' },
                ].map((item, i) => (
                  <div key={i} style={{ background: 'var(--bg-secondary)', borderRadius: 10, padding: 12 }}>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>{item.label}</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: item.color, fontFamily: 'JetBrains Mono' }}>{item.value}</div>
                  </div>
                ))}
              </div>

              {/* Per-taxi assignment */}
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 10 }}>
                Taxi Assignments
              </div>
              {result.taxi_assignments.map((assignment, i) => (
                <div key={i} style={{
                  background: 'var(--bg-secondary)', borderRadius: 10, padding: 12, marginBottom: 8,
                  borderLeft: `3px solid ${TAXI_COLORS[i % TAXI_COLORS.length]}`
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Car size={14} color={TAXI_COLORS[i % TAXI_COLORS.length]} />
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 13.5 }}>
                        {assignment.taxi_name}
                      </span>
                    </div>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {assignment.route_distance_km} km · {assignment.estimated_duration_min} min
                    </span>
                  </div>
                  {assignment.stops.map((stop, j) => (
                    <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-secondary)', padding: '3px 0' }}>
                      <div style={{ width: 18, height: 18, borderRadius: '50%', background: `${TAXI_COLORS[i % TAXI_COLORS.length]}22`, color: TAXI_COLORS[i % TAXI_COLORS.length], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700 }}>
                        {j + 1}
                      </div>
                      {stop.name}
                    </div>
                  ))}
                </div>
              ))}

              <div style={{ marginTop: 10, fontSize: 11.5, color: '#94a3b8', fontStyle: 'italic' }}>
                {result.description}
              </div>
            </div>
          )}
        </div>

        {/* Map */}
        <div style={{ position: 'sticky', top: 0 }}>
          <div className="map-container">
            <MapContainer
              center={[28.6139, 77.2090]}
              zoom={10}
              style={{ height: '75vh', width: '100%' }}
              id="multistop-map"
            >
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; OpenStreetMap contributors &copy; CARTO'
              />
              <MapStopHandler addingStop={addingStop} onAdd={handleMapClick} />

              {/* Stop markers */}
              {stops.map((stop, i) => (
                <Marker key={i} position={[stop.lat, stop.lng]} icon={StopIcon(i)}>
                  <Popup>
                    <strong>Stop {i + 1}</strong><br />{stop.name}
                  </Popup>
                </Marker>
              ))}

              {/* VRP routes */}
              {result && result.taxi_assignments.map((assignment, i) => (
                assignment.route_coords.length > 1 && (
                  <Polyline
                    key={i}
                    positions={assignment.route_coords}
                    color={TAXI_COLORS[i % TAXI_COLORS.length]}
                    weight={3}
                    opacity={0.8}
                    dashArray={i > 0 ? '8,4' : undefined}
                  />
                )
              ))}
            </MapContainer>
          </div>
        </div>
      </div>
    </div>
  )
}
