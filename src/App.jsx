import { useState, useEffect } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from './Firebase'
import Routing from './utils/Routing'

function App() {
  const [authReady, setAuthReady] = useState(false)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    if (!auth) { setAuthReady(true); return }
    const unsub = onAuthStateChanged(auth, () => {
      setAuthReady(true)
      setTimeout(() => setVisible(false), 300)
    })
    return unsub
  }, [])

  return (
    <>
      {visible && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: '#fff',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px',
            opacity: authReady ? 0 : 1,
            transition: 'opacity 0.3s ease',
            pointerEvents: authReady ? 'none' : 'all',
          }}
        >
          <span style={{ fontSize: '22px', fontWeight: 800, color: '#1a8efd', letterSpacing: '-0.5px' }}>DocScout</span>
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ animation: 'spin 0.8s linear infinite' }}>
            <circle cx="18" cy="18" r="15" stroke="#e5e7eb" strokeWidth="3.5" />
            <path d="M33 18A15 15 0 0 1 18 33" stroke="#1a8efd" strokeWidth="3.5" strokeLinecap="round" />
          </svg>
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      )}
      <Routing />
    </>
  )
}

export default App
