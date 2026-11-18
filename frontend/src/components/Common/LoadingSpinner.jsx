export function LoadingSpinner({ size = 'md', text = 'Loading...' }) {
  const sizeClass = size === 'lg' ? 'spinner spinner-lg' : 'spinner'
  return (
    <div className="loading-overlay">
      <div className={sizeClass} />
      {text && <span>{text}</span>}
    </div>
  )
}

export function InlineSpinner() {
  return <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
}
