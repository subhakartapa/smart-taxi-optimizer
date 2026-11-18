import { AlertCircle, Info } from 'lucide-react'

export function ErrorMessage({ message }) {
  if (!message) return null
  return (
    <div className="error-box">
      <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
      <span>{message}</span>
    </div>
  )
}

export function InfoMessage({ message }) {
  if (!message) return null
  return (
    <div className="info-box">
      <Info size={14} style={{ flexShrink: 0, marginTop: 1 }} />
      <span>{message}</span>
    </div>
  )
}
