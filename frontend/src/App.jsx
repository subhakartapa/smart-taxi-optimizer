import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Sidebar from './components/Layout/Sidebar'
import Navbar from './components/Layout/Navbar'
import Dashboard from './pages/Dashboard'
import RouteOptimizer from './pages/RouteOptimizer'
import TaxiManagement from './pages/TaxiManagement'
import MultiStop from './pages/MultiStop'
import TripHistory from './pages/TripHistory'
import About from './pages/About'

export default function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <BrowserRouter>
      <div className="app-layout">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(prev => !prev)}
        />
        <div className={`main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
          <Navbar />
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/optimize" element={<RouteOptimizer />} />
            <Route path="/taxis" element={<TaxiManagement />} />
            <Route path="/multistop" element={<MultiStop />} />
            <Route path="/history" element={<TripHistory />} />
            <Route path="/about" element={<About />} />
          </Routes>
        </div>
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#111827',
              color: '#f1f5f9',
              border: '1px solid #1e293b',
              fontSize: 13,
            },
          }}
        />
      </div>
    </BrowserRouter>
  )
}
