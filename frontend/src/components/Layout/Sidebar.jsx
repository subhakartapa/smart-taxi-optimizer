import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Map, Car, Route, History, Info,
  ChevronLeft, ChevronRight, Zap
} from 'lucide-react'

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard, section: 'MAIN' },
  { path: '/optimize', label: 'Route Optimizer', icon: Map, section: 'TOOLS' },
  { path: '/taxis', label: 'Taxi Management', icon: Car, section: 'TOOLS' },
  { path: '/multistop', label: 'Multi-Stop VRP', icon: Route, section: 'TOOLS' },
  { path: '/history', label: 'Trip History', icon: History, section: 'DATA' },
  { path: '/about', label: 'About Project', icon: Info, section: 'DATA' },
]

export default function Sidebar({ collapsed, onToggle }) {
  const location = useLocation()
  const navigate = useNavigate()

  const sections = [...new Set(NAV_ITEMS.map(i => i.section))]

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <Zap size={22} color="white" />
        </div>
        <div className="sidebar-logo-text">
          <h1>SmartTaxi</h1>
          <span>Route Optimizer</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {sections.map(section => (
          <div key={section}>
            <div className="nav-section-label">{section}</div>
            {NAV_ITEMS.filter(i => i.section === section).map(item => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              return (
                <button
                  key={item.path}
                  className={`nav-item ${isActive ? 'active' : ''}`}
                  onClick={() => navigate(item.path)}
                  title={collapsed ? item.label : ''}
                >
                  <Icon className="nav-icon" size={18} />
                  <span className="nav-label">{item.label}</span>
                </button>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Collapse button */}
      <div className="sidebar-footer">
        <button className="collapse-btn" onClick={onToggle}>
          {collapsed
            ? <ChevronRight size={16} />
            : <><ChevronLeft size={16} /><span style={{ fontSize: 13 }}>Collapse</span></>
          }
        </button>
      </div>
    </aside>
  )
}
