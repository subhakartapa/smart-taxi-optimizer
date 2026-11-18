import { useLocation } from 'react-router-dom'
import { Bell, Server } from 'lucide-react'

const PAGE_TITLES = {
  '/': 'Dashboard',
  '/optimize': 'Route Optimizer',
  '/taxis': 'Taxi Management',
  '/multistop': 'Multi-Stop VRP',
  '/history': 'Trip History',
  '/about': 'About Project',
}

export default function Navbar() {
  const location = useLocation()
  const title = PAGE_TITLES[location.pathname] || 'Smart Taxi'

  return (
    <header className="navbar">
      <h2 className="navbar-title">{title}</h2>
      <div className="navbar-right">
        <div className="status-badge online">
          <div className="status-dot" />
          <span>Backend Online</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px',
          background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.2)',
          borderRadius: 20, fontSize: 12, color: '#a78bfa' }}>
          <Server size={12} />
          <span>Flask + NetworkX</span>
        </div>
      </div>
    </header>
  )
}
