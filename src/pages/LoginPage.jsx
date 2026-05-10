import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

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
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #1a1a4e 0%, #2d1b69 40%, #1a1a6e 100%)' }}>

      {/* Animated stars background */}
      {Array.from({ length: 30 }).map((_, i) => (
        <div key={i} className="absolute rounded-full bg-white"
          style={{
            width: `${(i % 3) + 1}px`,
            height: `${(i % 3) + 1}px`,
            left: `${(i * 137.5) % 100}%`,
            top: `${(i * 97.3) % 100}%`,
            opacity: 0.4 + (i % 3) * 0.2,
            animation: `sparkle ${2 + (i % 3)}s ease-in-out ${(i % 5) * 0.4}s infinite`,
          }} />
      ))}

      {/* Floating math symbols */}
      {['∑', 'π', '√', '∞', '×', '÷', '%', '='].map((sym, i) => (
        <div key={i} className="absolute font-black select-none pointer-events-none"
          style={{
            fontSize: `${20 + (i % 3) * 10}px`,
            left: `${(i * 137.5) % 100}%`,
            top: `${(i * 97.3) % 100}%`,
            color: ['#fbbf24', '#a78bfa', '#34d399', '#60a5fa'][i % 4],
            opacity: 0.15,
            animation: `float ${4 + (i % 3)}s ease-in-out ${i * 0.5}s infinite`,
          }}>
          {sym}
        </div>
      ))}

      <div className="relative z-10 w-full max-w-sm flex flex-col items-center">
        {/* Logo */}
        <img
          src="/matemagia/logo.png"
          alt="MateMagia"
          className="w-48 h-48 object-contain mb-2 drop-shadow-2xl"
          style={{ animation: 'float 3s ease-in-out infinite' }}
        />

        <p className="text-purple-200 font-bold text-center text-base mb-8">
          ¡Aprende matemáticas de forma mágica! ✨
        </p>

        {/* Login card */}
        <div className="w-full bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/20 shadow-2xl">
          <h2 className="text-xl font-black text-center text-white mb-1">¡Bienvenido/a! 👋</h2>
          <p className="text-center text-purple-200 text-sm font-medium mb-6">
            Para estudiantes y apoderados de 1ro a 6to básico
          </p>

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white rounded-2xl py-4 px-5 font-bold text-gray-700 hover:bg-gray-50 active:scale-95 transition-all disabled:opacity-60 shadow-lg text-base"
          >
            {loading ? (
              <><span className="animate-spin text-xl">⏳</span> Iniciando sesión...</>
            ) : (
              <>
                <svg width="22" height="22" viewBox="0 0 48 48">
                  <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
                  <path fill="#FF3D00" d="m6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"/>
                  <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
                  <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
                </svg>
                Continuar con Google
              </>
            )}
          </button>

          {error && <p className="mt-3 text-center text-red-300 text-sm font-semibold">{error}</p>}
        </div>

        {/* Badges */}
        <div className="flex justify-center gap-2 mt-5 flex-wrap">
          {['1ro', '2do', '3ro', '4to', '5to', '6to'].map(g => (
            <span key={g} className="bg-white/15 text-white/80 font-bold px-3 py-1 rounded-full text-xs border border-white/20">
              {g} básico
            </span>
          ))}
        </div>

        <p className="text-white/40 text-xs mt-4 text-center">
          Seguro y gratuito · Datos protegidos
        </p>
      </div>
    </div>
  )
}
