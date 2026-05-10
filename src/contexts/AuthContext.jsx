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

    supabase.auth.getSession().then(({ data }) => {
      const session = data?.session ?? null
      setSession(session)
      setUser(session?.user ?? null)
    }).catch(() => {}).finally(() => {
      clearTimeout(timeout)
      setLoading(false)
    })

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
    const { data, error } = await supabase.auth.signUp({
      email: sanitizeEmail(email),
      password,
      options: { data: { full_name: fullName } },
    })
    if (error) throw error
    return data
  }

  async function resetPassword(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(sanitizeEmail(email), {
      redirectTo: window.location.origin + '/matemagia/',
    })
    if (error) throw error
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    // Clear local storage fallback data
    localStorage.removeItem('mm_progress')
    localStorage.removeItem('mm_profile')
  }

  const value = { user, session, loading, signInWithGoogle, signInWithEmail, signUpWithEmail, resetPassword, signOut }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
