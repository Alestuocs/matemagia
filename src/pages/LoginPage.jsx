import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

export default function LoginPage() {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, resetPassword } = useAuth()
  const [tab, setTab] = useState('login') // 'login' | 'register'
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleEmailSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (!email || !password) { setError('Completa todos los campos.'); return }
    if (tab === 'register' && !fullName.trim()) { setError('Ingresa tu nombre completo.'); return }
    if (password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres.'); return }
    setLoading(true)
    try {
      if (tab === 'login') {
        await signInWithEmail(email, password)
      } else {
        await signUpWithEmail(email, password, fullName.trim())
        setSuccess('¡Registro exitoso! Revisa tu correo para confirmar tu cuenta.')
      }
    } catch (e) {
      const msg = e.message || ''
      if (msg === 'BETA_NOT_ALLOWED') {
        setError('MateMagia está en beta cerrada. Tu correo no está en la lista de acceso. Escribe a contacto@matemagia.app para solicitar una invitación.')
      }
      else if (msg.includes('Invalid login')) setError('Correo o contraseña incorrectos.')
      else if (msg.includes('already registered')) setError('Este correo ya está registrado. Inicia sesión.')
      else if (msg.includes('Email not confirmed')) setError('Confirma tu correo antes de iniciar sesión.')
      else setError('Error: ' + msg)
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogle() {
    setError('')
    setLoading(true)
    try { await signInWithGoogle() } catch { setError('No se pudo iniciar con Google.'); setLoading(false) }
  }

  async function handleReset() {
    if (!email) { setError('Ingresa tu correo primero.'); return }
    try { await resetPassword(email); setSuccess('¡Revisa tu correo para restablecer tu contraseña!') }
    catch { setError('No se pudo enviar el correo.') }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #1a1a4e 0%, #2d1b69 40%, #1a1a6e 100%)' }}>

      {Array.from({ length: 30 }).map((_, i) => (
        <div key={i} className="absolute rounded-full bg-white"
          style={{ width: `${(i%3)+1}px`, height: `${(i%3)+1}px`, left: `${(i*137.5)%100}%`, top: `${(i*97.3)%100}%`, opacity: 0.4+(i%3)*0.2, animation: `sparkle ${2+(i%3)}s ease-in-out ${(i%5)*0.4}s infinite` }} />
      ))}

      <div className="relative z-10 w-full max-w-sm flex flex-col items-center">
        <img src="/matemagia/logo.png" alt="MateMagia" className="w-36 h-36 object-contain mb-2 drop-shadow-2xl" style={{ animation: 'float 3s ease-in-out infinite' }} />
        <p className="text-purple-200 font-bold text-center text-sm mb-5">¡Aprende matemáticas de forma mágica! ✨</p>

        {tab === 'register' && (
          <div className="w-full mb-3 bg-yellow-400/20 border border-yellow-300/40 rounded-2xl px-4 py-2 text-xs font-bold text-yellow-100 text-center">
            🚧 Beta cerrada: solo correos invitados pueden crear cuenta.
          </div>
        )}

        <div className="w-full bg-white/10 backdrop-blur-md rounded-3xl p-5 border border-white/20 shadow-2xl">
          {/* Tabs */}
          <div className="flex rounded-2xl bg-white/10 p-1 mb-4">
            {[['login','Iniciar sesión'],['register','Registrarse']].map(([t,label]) => (
              <button key={t} onClick={() => { setTab(t); setError(''); setSuccess('') }}
                className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${tab===t ? 'bg-white text-purple-700 shadow' : 'text-white/70'}`}>
                {label}
              </button>
            ))}
          </div>

          <form onSubmit={handleEmailSubmit} className="space-y-3">
            {tab === 'register' && (
              <input type="text" placeholder="Nombre completo" value={fullName} onChange={e => setFullName(e.target.value)}
                className="w-full bg-white/20 text-white placeholder-white/50 rounded-2xl px-4 py-3 text-sm font-semibold outline-none border border-white/20 focus:border-white/60" />
            )}
            <input type="email" placeholder="Correo electrónico" value={email} onChange={e => setEmail(e.target.value)}
              className="w-full bg-white/20 text-white placeholder-white/50 rounded-2xl px-4 py-3 text-sm font-semibold outline-none border border-white/20 focus:border-white/60" />
            <input type="password" placeholder="Contraseña (mín. 6 caracteres)" value={password} onChange={e => setPassword(e.target.value)}
              className="w-full bg-white/20 text-white placeholder-white/50 rounded-2xl px-4 py-3 text-sm font-semibold outline-none border border-white/20 focus:border-white/60" />

            {error && <p className="text-red-300 text-xs font-semibold text-center">{error}</p>}
            {success && <p className="text-green-300 text-xs font-semibold text-center">{success}</p>}

            <button type="submit" disabled={loading}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl py-3 font-black text-base shadow-lg active:scale-95 transition-all disabled:opacity-60">
              {loading ? '⏳ Cargando...' : tab === 'login' ? '🚀 Entrar' : '✨ Crear cuenta'}
            </button>
          </form>

          {tab === 'login' && (
            <button onClick={handleReset} className="w-full text-center text-white/50 text-xs mt-2 hover:text-white/80 transition-colors">
              ¿Olvidaste tu contraseña?
            </button>
          )}

          <div className="flex items-center gap-2 my-4">
            <div className="flex-1 h-px bg-white/20" />
            <span className="text-white/40 text-xs font-bold">o</span>
            <div className="flex-1 h-px bg-white/20" />
          </div>

          <button onClick={handleGoogle} disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white rounded-2xl py-3 px-5 font-bold text-gray-700 hover:bg-gray-50 active:scale-95 transition-all disabled:opacity-60 shadow-lg text-sm">
            <svg width="20" height="20" viewBox="0 0 48 48">
              <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
              <path fill="#FF3D00" d="m6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"/>
              <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
              <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
            </svg>
            Continuar con Google
          </button>
        </div>

        <div className="flex justify-center gap-2 mt-4 flex-wrap">
          {['1ro','2do','3ro','4to','5to','6to','7mo','8vo'].map(g => (
            <span key={g} className="bg-white/15 text-white/80 font-bold px-3 py-1 rounded-full text-xs border border-white/20">{g} básico</span>
          ))}
        </div>
        <p className="text-white/40 text-xs mt-3 text-center">Seguro y gratuito · Datos protegidos</p>
      </div>
    </div>
  )
}
