import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session with 8s timeout fallback
    const timeout = setTimeout(() => setLoading(false), 8000)

    // Promise.race wrapper so a hung supabase call (refresh_token also
    // expired, network black-hole) can't lock the app in "Cargando…".
    const withTimeout = (p, ms, label = 'op') => Promise.race([
      p,
      new Promise((_, reject) => setTimeout(() => reject(new Error(`${label} timeout`)), ms)),
    ])

    ;(async () => {
      try {
        const { data: initial } = await withTimeout(
          supabase.auth.getSession(), 4000, 'getSession'
        ).catch(() => ({ data: null }))
        const initialSession = initial?.session ?? null

        if (initialSession) {
          // Proactively refresh, but never block the boot for more than
          // 4s. If the refresh times out or the refresh_token is dead,
          // we keep the cached session — the data-load-error UI will
          // catch the bad-JWT case and offer "cerrar sesión".
          try {
            const { data: refreshed } = await withTimeout(
              supabase.auth.refreshSession(), 4000, 'refreshSession'
            )
            const fresh = refreshed?.session || initialSession
            setSession(fresh)
            setUser(fresh?.user ?? null)
          } catch (_) {
            setSession(initialSession)
            setUser(initialSession?.user ?? null)
          }
        } else {
          setSession(null)
          setUser(null)
        }
      } catch (e) {
        console.warn('auth bootstrap failed:', e)
      } finally {
        clearTimeout(timeout)
        setLoading(false)
      }
    })()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        await upsertProfile(session.user)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function upsertProfile(user) {
    try {
      const { error } = await supabase.from('profiles').upsert({
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Estudiante',
        avatar_url: user.user_metadata?.avatar_url || null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' })
      if (error) console.warn('Profile upsert error:', error.message)
    } catch (e) {
      console.warn('Profile upsert failed:', e)
    }
  }

  function sanitizeEmail(email) {
    return email.trim().toLowerCase().slice(0, 254)
  }

  async function signInWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/matemagia/',
      },
    })
    if (error) throw error
  }

  async function signInWithEmail(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: sanitizeEmail(email),
      password,
    })
    if (error) throw error
    return data
  }

  async function signUpWithEmail(email, password, fullName) {
    const normEmail = sanitizeEmail(email)

    // Beta preflight check — returns FALSE if email not on allowlist
    const { data: allowed, error: rpcError } = await supabase
      .rpc('is_email_allowed', { check_email: normEmail })
    if (rpcError) {
      throw new Error('No se pudo verificar el correo. Intenta nuevamente.')
    }
    if (allowed === false) {
      throw new Error('BETA_NOT_ALLOWED')
    }

    const { data, error } = await supabase.auth.signUp({
      email: normEmail,
      password,
      options: { data: { full_name: fullName } },
    })
    if (error) {
      // Server-side beta trigger throws this if preflight was bypassed
      if (/BETA_NOT_ALLOWED/i.test(error.message)) {
        throw new Error('BETA_NOT_ALLOWED')
      }
      throw error
    }
    return data
  }

  async function resetPassword(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(sanitizeEmail(email), {
      redirectTo: window.location.origin + '/matemagia/',
    })
    if (error) throw error
  }

  async function signOut() {
    // Always clear local state first so the UI flips back to login even if
    // the network call below fails (e.g. JWT already expired, offline).
    try { localStorage.removeItem('mm_progress') } catch (_) {}
    try { localStorage.removeItem('mm_profile') } catch (_) {}
    try {
      await supabase.auth.signOut()
    } catch (e) {
      console.warn('supabase signOut failed, forcing local logout:', e)
    }
    // Force-blank user immediately so AppRoutes redirects to LoginPage even
    // if onAuthStateChange is slow.
    setSession(null)
    setUser(null)
  }

  const value = { user, session, loading, signInWithGoogle, signInWithEmail, signUpWithEmail, resetPassword, signOut }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
