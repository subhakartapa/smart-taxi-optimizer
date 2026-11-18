import { useState, useEffect } from 'react'
import { taxiAPI } from '../api/client'
import { LoadingSpinner } from '../components/Common/LoadingSpinner'
import { ErrorMessage } from '../components/Common/ErrorMessage'
import { Car, Plus, MapPin, Trash2, RefreshCw, Edit3 } from 'lucide-react'

const STATUS_OPTIONS = ['available', 'busy', 'offline']

function TaxiCard({ taxi, onStatusChange, onDelete }) {
  const [updating, setUpdating] = useState(false)

  const handleStatus = async (newStatus) => {
    setUpdating(true)
    try {
      await onStatusChange(taxi.id, newStatus)
    } finally {
      setUpdating(false)
    }
  }

  return (
    <div className="taxi-card fade-in">
      <div className="taxi-card-header">
        <div>
          <div className="taxi-id">{taxi.name}</div>
          <div className="taxi-driver">👤 {taxi.driver_name}</div>
        </div>
        <span className={`badge badge-${taxi.status}`}>{taxi.status}</span>
      </div>

      <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', gap: 4, alignItems: 'center', marginBottom: 12 }}>
        <MapPin size={11} />
        <span style={{ fontFamily: 'JetBrains Mono' }}>
          {taxi.lat?.toFixed(4)}, {taxi.lng?.toFixed(4)}
        </span>
      </div>

      <div className="taxi-stats">
        <div className="taxi-stat-item">
          <div className="taxi-stat-label">Trips</div>
          <div className="taxi-stat-value">{taxi.total_trips}</div>
        </div>
        <div className="taxi-stat-item">
          <div className="taxi-stat-label">Distance</div>
          <div className="taxi-stat-value">{(taxi.total_distance || 0).toFixed(0)} km</div>
        </div>
      </div>

      <div style={{ marginTop: 14, display: 'flex', gap: 6 }}>
        <select
          className="form-input form-select"
          value={taxi.status}
          onChange={(e) => handleStatus(e.target.value)}
          disabled={updating}
          style={{ flex: 1, fontSize: 12, padding: '7px 10px' }}
        >
          {STATUS_OPTIONS.map(s => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
        <button
          className="btn btn-danger btn-sm"
          onClick={() => onDelete(taxi.id, taxi.name)}
          title="Delete taxi"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  )
}

export default function TaxiManagement() {
  const [taxis, setTaxis] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', driver_name: '', lat: '28.6139', lng: '77.2090' })
  const [formError, setFormError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [filterStatus, setFilterStatus] = useState('all')

  const fetchTaxis = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await taxiAPI.getAll()
      setTaxis(res.data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchTaxis() }, [])

  const handleAddTaxi = async (e) => {
    e.preventDefault()
    setFormError(null)

    if (!form.name || !form.driver_name) {
      setFormError('Taxi ID and driver name are required.')
      return
    }

    const lat = parseFloat(form.lat)
    const lng = parseFloat(form.lng)
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      setFormError('Invalid coordinates.')
      return
    }

    setSubmitting(true)
    try {
      await taxiAPI.create({ name: form.name, driver_name: form.driver_name, lat, lng })
      setForm({ name: '', driver_name: '', lat: '28.6139', lng: '77.2090' })
      setShowForm(false)
      await fetchTaxis()
    } catch (e) {
      setFormError(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleStatusChange = async (id, status) => {
    try {
      await taxiAPI.updateStatus(id, status)
      setTaxis(prev => prev.map(t => t.id === id ? { ...t, status } : t))
    } catch (e) {
      setError(e.message)
    }
  }

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete taxi ${name}? This cannot be undone.`)) return
    try {
      await taxiAPI.delete(id)
      setTaxis(prev => prev.filter(t => t.id !== id))
    } catch (e) {
      setError(e.message)
    }
  }

  const filtered = filterStatus === 'all' ? taxis : taxis.filter(t => t.status === filterStatus)

  const counts = {
    all: taxis.length,
    available: taxis.filter(t => t.status === 'available').length,
    busy: taxis.filter(t => t.status === 'busy').length,
    offline: taxis.filter(t => t.status === 'offline').length,
  }

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <h1>Taxi Management</h1>
        <p>Manage your fleet — register new taxis, update status, and monitor performance</p>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 8 }}>
          {['all', 'available', 'busy', 'offline'].map(s => (
            <button
              key={s}
              className={`btn btn-sm ${filterStatus === s ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilterStatus(s)}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)} ({counts[s]})
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" onClick={fetchTaxis}>
            <RefreshCw size={14} /> Refresh
          </button>
          <button className="btn btn-primary" id="add-taxi-btn" onClick={() => setShowForm(!showForm)}>
            <Plus size={16} /> {showForm ? 'Cancel' : 'Add Taxi'}
          </button>
        </div>
      </div>

      {/* Add Taxi Form */}
      {showForm && (
        <div className="card fade-in" style={{ marginBottom: 20, border: '1px solid rgba(6,182,212,0.3)' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
            <Car size={16} color="#06b6d4" />
            Register New Taxi
          </div>
          <form onSubmit={handleAddTaxi}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Taxi ID *</label>
                <input
                  className="form-input"
                  id="taxi-id-input"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. TX-011"
                  required
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Driver Name *</label>
                <input
                  className="form-input"
                  id="driver-name-input"
                  value={form.driver_name}
                  onChange={e => setForm({ ...form, driver_name: e.target.value })}
                  placeholder="e.g. Ravi Kumar"
                  required
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Latitude</label>
                <input
                  className="form-input"
                  id="taxi-lat-input"
                  type="number"
                  step="0.0001"
                  value={form.lat}
                  onChange={e => setForm({ ...form, lat: e.target.value })}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Longitude</label>
                <input
                  className="form-input"
                  id="taxi-lng-input"
                  type="number"
                  step="0.0001"
                  value={form.lng}
                  onChange={e => setForm({ ...form, lng: e.target.value })}
                />
              </div>
            </div>

            {formError && <div style={{ marginTop: 12 }}><ErrorMessage message={formError} /></div>}

            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button type="submit" id="submit-taxi-btn" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Saving...' : <><Plus size={15} /> Register Taxi</>}
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {error && <div style={{ marginBottom: 16 }}><ErrorMessage message={error} /></div>}

      {loading ? (
        <LoadingSpinner text="Loading taxis..." />
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
          <Car size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
          <div>No taxis found for the selected filter.</div>
        </div>
      ) : (
        <div className="taxi-grid">
          {filtered.map(taxi => (
            <TaxiCard
              key={taxi.id}
              taxi={taxi}
              onStatusChange={handleStatusChange}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}
