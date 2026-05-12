import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useProgress } from '../../contexts/ProgressContext'

// Shown when the user is authenticated but the Supabase read for their
// user_progress never confirmed. Surfacing this (instead of silently
// rendering a Dashboard with default zeros) was a critical QA finding:
// users were seeing "1ro Básico · 0 XP" even when the DB had their real
// progress, because the JWT had gone stale.
export default function DataLoadError() {
  const { retrySync } = useProgress()
  const { signOut } = useAuth()
  const [retrying, setRetrying] = useState(false)

  async function handleRetry() {
    setRetrying(true)
    try { await retrySync() } catch (_) {}
    setRetrying(false)
  }

  async function handleLogout() {
    try { await signOut() } catch (_) {}
    window.location.reload()
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-purple-100 to-yellow-50">
      <div className="max-w-sm w-full bg-white rounded-3xl shadow-xl p-6 text-center space-y-4">
        <div className="text-5xl">📡</div>
        <h1 className="font-black text-magic-700 text-xl">No pudimos cargar tu perfil</h1>
        <p className="text-gray-600 text-sm">
          Tu progreso está guardado en la nube. Esto puede pasar si tu
          sesión expiró o tu conexión es lenta. Vamos a intentarlo de nuevo.
        </p>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={handleRetry}
            disabled={retrying}
            className="w-full bg-magic-500 text-white rounded-2xl py-3 font-black text-base active:scale-95 disabled:opacity-60"
          >
            {retrying ? 'Reintentando…' : '🔄 Reintentar'}
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full bg-gray-100 text-gray-700 rounded-2xl py-2 text-sm font-bold"
          >
            🚪 Cerrar sesión y volver a entrar
          </button>
        </div>
      </div>
    </div>
  )
}
