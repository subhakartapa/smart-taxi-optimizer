export default function StatCard({ icon: Icon, label, value, unit = '', color, trend, trendDir }) {
  const colorMap = {
    cyan: { bg: 'rgba(6,182,212,0.1)', color: '#06b6d4', cssVar: '#06b6d4' },
    green: { bg: 'rgba(16,185,129,0.1)', color: '#10b981', cssVar: '#10b981' },
    amber: { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b', cssVar: '#f59e0b' },
    purple: { bg: 'rgba(139,92,246,0.1)', color: '#8b5cf6', cssVar: '#8b5cf6' },
    blue: { bg: 'rgba(59,130,246,0.1)', color: '#3b82f6', cssVar: '#3b82f6' },
    red: { bg: 'rgba(239,68,68,0.1)', color: '#ef4444', cssVar: '#ef4444' },
  }
  const c = colorMap[color] || colorMap.cyan

  return (
    <div className="stat-card fade-in" style={{ '--stat-color': c.cssVar }}>
      <div className="stat-icon-wrap" style={{ background: c.bg }}>
        <Icon size={22} color={c.color} />
      </div>
      <div className="stat-info">
        <div className="stat-label">{label}</div>
        <div className="stat-value">
          {value}
          {unit && <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-muted)', marginLeft: 4 }}>{unit}</span>}
        </div>
        {trend && (
          <div className="stat-trend" style={{ color: trendDir === 'up' ? '#10b981' : '#94a3b8' }}>
            {trendDir === 'up' ? '▲' : '—'} {trend}
          </div>
        )}
      </div>
    </div>
  )
}
