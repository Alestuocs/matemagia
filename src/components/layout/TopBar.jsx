import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProgress } from '../../contexts/ProgressContext'
import { useAuth } from '../../contexts/AuthContext'
import XPBar from '../ui/XPBar'

// Global TopBar with a discreet user menu (⋯). The menu always exposes
// "Cerrar sesión" so the user can sign out from any screen, plus a
// quick link to the profile.
export default function TopBar({ title, showBack = true, showXP = false }) {
  const navigate = useNavigate()
  const { progress } = useProgress()
  const { signOut, user } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  async function handleSignOut() {
    setMenuOpen(false)
    try { await signOut() } catch (e) { console.warn(e) }
    navigate('/', { replace: true })
  }

  return (
    <div className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-gray-100 safe-top">
      <div className="flex items-center gap-3 px-4 py-3 max-w-lg mx-auto">
        {showBack && (
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center active:scale-90 transition-transform"
            aria-label="Volver"
          >
            ←
          </button>
        )}
        <h1 className="flex-1 font-black text-lg text-gray-800 truncate">{title}</h1>
        {showXP && (
          <div className="flex items-center gap-1 bg-magic-50 px-2 py-1 rounded-full">
            <span className="text-xs font-bold text-magic-600">⭐ {progress.xp}</span>
          </div>
        )}

        {user && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen(o => !o)}
              className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center active:scale-90 transition"
              aria-label="Más opciones"
            >
              ⋯
            </button>
            {menuOpen && (
              <>
                <button
                  type="button"
                  onClick={() => setMenuOpen(false)}
                  aria-hidden="true"
                  className="fixed inset-0 z-10 cursor-default bg-transparent"
                />
                <div className="absolute right-0 top-11 z-20 w-44 bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => { setMenuOpen(false); navigate('/profile') }}
                    className="block w-full text-left px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50"
                  >
                    👤 Mi perfil
                  </button>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="block w-full text-left px-4 py-2.5 text-sm font-bold text-red-500 hover:bg-red-50 border-t border-gray-100"
                  >
                    🚪 Cerrar sesión
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
      {showXP && (
        <div className="px-4 pb-2 max-w-lg mx-auto">
          <XPBar xp={progress.xp} compact />
        </div>
      )}
    </div>
  )
}
