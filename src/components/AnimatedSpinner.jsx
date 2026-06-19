import { useEffect } from 'react'

const CSS = `
@property --rasad-d1 { syntax: "<angle>"; initial-value: 0deg; inherits: false; }
@property --rasad-d2 { syntax: "<angle>"; initial-value: 0deg; inherits: false; }
@property --rasad-d3 { syntax: "<angle>"; initial-value: 0deg; inherits: false; }
@keyframes rasad-s1 { to { --rasad-d1: 360deg; } }
@keyframes rasad-s2 { to { --rasad-d2: 360deg; } }
@keyframes rasad-s3 { to { --rasad-d3: 360deg; } }
.rasad-r1 {
  background: conic-gradient(#00D4FF var(--rasad-d1), transparent 0deg);
  filter: drop-shadow(0 0 8px rgba(0,212,255,0.7));
  animation: rasad-s1 1.2s infinite linear;
  border-radius: 50%;
}
.rasad-r2 {
  background: conic-gradient(#7C3AED var(--rasad-d2), transparent 0deg);
  filter: drop-shadow(0 0 6px rgba(124,58,237,0.7));
  animation: rasad-s2 1.8s infinite linear reverse;
  border-radius: 50%;
}
.rasad-r3 {
  background: conic-gradient(#00FF9D var(--rasad-d3), transparent 0deg);
  filter: drop-shadow(0 0 5px rgba(0,255,157,0.7));
  animation: rasad-s3 0.9s infinite linear;
  border-radius: 50%;
}
`

let injected = false
function injectStyles() {
  if (injected || typeof document === 'undefined') return
  const el = document.createElement('style')
  el.setAttribute('data-rasad-spinner', '')
  el.textContent = CSS
  document.head.appendChild(el)
  injected = true
}

export default function AnimatedSpinner({ size = 48, className = '' }) {
  useEffect(() => { injectStyles() }, [])

  return (
    <div
      className={`relative flex-shrink-0 ${className}`}
      style={{ width: size, height: size }}
      aria-label="در حال بارگذاری"
      role="status"
    >
      <div className="rasad-r1 absolute inset-0" />
      <div className="rasad-r2 absolute" style={{ inset: '22%' }} />
      <div className="rasad-r3 absolute" style={{ inset: '44%' }} />
    </div>
  )
}
