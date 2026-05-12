import { useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'

// Branded loading screen that progressively shows escape hatches.
//  - 0-12s: just the spinner + tagline.
//  - 12s+:  show "Algo va lento. Intentar de nuevo" link (forces reload).
//  - 25s+:  show "Cerrar sesión" link as last-resort recovery so the
//           kid/parent is never stuck on a forever-loading screen.
export default function LoadingScreen({ text = 'Cargando MateMagia...' }) {
  const { signOut } = useAuth() || {}
  const [seconds, setSeconds] = useState(0)

  useEffect(() => {
    const i = setInterval(() => setSeconds(s => s + 1), 1000)
    return () => clearInterval(i)
  }, [])

  function hardReload() {
    try {
      // Clear ALL local progress caches so a corrupted user-scoped cache
      // can't keep the app stuck after reload.
      Object.keys(localStorage).forEach(k => {
        if (k.startsWith('mm_progress')) localStorage.removeItem(k)
      })
    } catch (_) {}
    window.location.reload()
  }

  async function fullLogout() {
    try { if (signOut) await signOut() } catch (_) {}
    try {
      Object.keys(localStorage).forEach(k => {
        if (k.startsWith('mm_progress') || k.startsWith('matemagia-')) {
          localStorage.removeItem(k)
        }
      })
    } catch (_) {}
    window.location.replace(window.location.pathname)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 to-yellow-50 p-6">
      <div className="text-center max-w-sm w-full">
        <img
          src={import.meta.env.BASE_URL + 'logo.png'}
          alt="MateMagia"
          className="w-24 h-24 mx-auto mb-3 object-contain animate-pulse"
        />
        <p className="font-black text-magic-600 text-xl">{text}</p>

        {seconds >= 12 && (
          <div className="mt-6 space-y-2 text-sm">
            <p className="text-gray-500">Está tardando más de lo normal…</p>
            <button
              type="button"
              onClick={hardReload}
              className="block w-full bg-magic-100 hover:bg-magic-200 text-magic-700 rounded-2xl py-2 font-bold"
            >
              🔄 Reintentar
            </button>
          </div>
        )}

        {seconds >= 25 && signOut && (
          <button
            type="button"
            onClick={fullLogout}
            className="mt-2 block w-full bg-red-50 text-red-600 border border-red-200 rounded-2xl py-2 text-sm font-bold"
          >
            🚪 Cerrar sesión y empezar limpio
          </button>
        )}
      </div>
    </div>
  )
}
