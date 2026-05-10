import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

const FLOATING = ['1', '2', '3', '+', '−', '×', '÷', '=', '7', '5', '∞', 'π']

export default function LoginPage() {
  const { signInWithGoogle } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin() {
    setLoading(true)
    setError('')
    try {
      await signInWithGoogle()
    } catch (e) {
      setError('No se pudo iniciar sesión. Inténtalo de nuevo.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-magic-600 via-purple-700 to-indigo-800 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Floating math symbols */}
      {FLOATING.map((sym, i) => (
        <div
          key={i}
          className="absolute text-white/20 font-black select-none pointer-events-none"
          style={{
            fontSize: `${Math.random() * 30 + 20}px`,
            left: `${(i * 137.5) % 100}%`,
            top: `${(i * 97.3) % 100}%`,
            animation: `float ${3 + (i % 3)}s ease-in-out ${i * 0.3}s infinite`,
          }}
        >
          {sym}
        </div>
      ))}

      {/* Stars */}
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={`star-${i}`}
          className="absolute text-yellow-300 select-none pointer-events-none"
          style={{
            fontSize: `${Math.random() * 12 + 8}px`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animation: `sparkle ${2 + Math.random() * 2}s ease-in-out ${Math.random() * 2}s infinite`,
          }}
        >
          ✦
        </div>
      ))}

      {/* Card */}
      <div className="relative z-10 w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-7xl mb-3 animate-float">🪄</div>
          <h1 className="text-5xl font-black bg-gradient-to-r from-yellow-300 via-pink-300 to-purple-300 bg-clip-text text-transparent drop-shadow">
            MateMagia
          </h1>
          <p className="text-purple-200 font-bold mt-2 text-lg">
            ¡Aprende matemáticas de forma mágica!
          </p>
          <div className="flex justify-center gap-2 mt-3">
            {['🌟', '➕', '✨', '➖', '🎯'].map((e, i) => (
              <span key={i} className="text-xl" style={{ animationDelay: `${i * 0.2}s` }}>
                {e}
              </span>
            ))}
          </div>
        </div>

        {/* Login card */}
        <div className="bg-white rounded-3xl p-6 shadow-2xl">
          <h2 className="text-xl font-black text-center text-gray-800 mb-1">
            ¡Bienvenido/a! 👋
          </h2>
          <p className="text-center text-gray-500 font-semibold mb-5 text-sm">
            Inicia sesión para guardar tu progreso
          </p>

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 border-2 border-gray-200 rounded-2xl py-4 px-5 font-bold text-gray-700 hover:bg-gray-50 active:scale-95 transition-all disabled:opacity-60"
          >
            {loading ? (
              <span className="animate-spin text-xl">⏳</span>
            ) : (
              <>
                <svg width="24" height="24" viewBox="0 0 48 48">
                  <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
                  <path fill="#FF3D00" d="m6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"/>
                  <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
                  <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
                </svg>
                Continuar con Google
              </>
            )}
          </button>

          {error && (
            <p className="mt-3 text-center text-red-500 text-sm font-semibold">{error}</p>
          )}

          <p className="mt-4 text-center text-xs text-gray-400">
            Para estudiantes de 1ro a 6to básico 📚
          </p>
        </div>

        {/* Grade badges */}
        <div className="flex justify-center gap-2 mt-5 flex-wrap">
          {['1ro', '2do', '3ro', '4to', '5to', '6to'].map(g => (
            <span key={g} className="bg-white/20 text-white font-bold px-3 py-1 rounded-full text-sm">
              {g} básico
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
