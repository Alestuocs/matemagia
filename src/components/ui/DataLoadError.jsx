import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useProgress } from '../../contexts/ProgressContext'
import { supabase } from '../../lib/supabase'

export default function DataLoadError() {
  const { retrySync, loadError } = useProgress()
  const { signOut, session } = useAuth()
  const [retrying, setRetrying] = useState(false)
  const [diag, setDiag] = useState(null)

  async function handleRetry() {
    setRetrying(true)
    try { await retrySync() } catch (_) {}
    setRetrying(false)
  }

  async function fullLogout() {
    try {
      Object.keys(localStorage).forEach(k => {
        if (k.startsWith('mm_progress') || k.startsWith('matemagia-')) {
          localStorage.removeItem(k)
        }
      })
    } catch (_) {}
    try { await signOut() } catch (_) {}
    window.location.replace(window.location.pathname)
  }

  // Multi-probe diagnostic — pings several endpoints with explicit
  // 6-second timeouts so we can distinguish:
  //  · all probes timeout  → extension/firewall blocking *.supabase.co
  //  · only REST fails     → CORS / RLS / JWT
  //  · 401 on REST         → JWT expired
  //  · 403 on REST         → RLS denies
  //  · 404/[] on REST      → no row in user_progress
  //  · control fails too   → no internet at all
  async function runDiagnostic() {
    setDiag({ status: 'running' })

    const url = import.meta.env.VITE_SUPABASE_URL
      || 'https://abdvoipoewiuneabxyqb.supabase.co'
    const apikey = import.meta.env.VITE_SUPABASE_ANON_KEY
      || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiZHZvaXBvZXdpdW5lYWJ4eXFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0Mjg5MTAsImV4cCI6MjA5NDAwNDkxMH0.a9CI3g1OcXyYswFCXhwnfrM4eJ4HAaJf6ZdaW_iadh0'

    async function probe(label, fetchUrl, init) {
      const ctrl = new AbortController()
      const timer = setTimeout(() => ctrl.abort(), 6000)
      const t0 = performance.now()
      try {
        const r = await fetch(fetchUrl, { ...(init || {}), signal: ctrl.signal })
        const body = await r.text().catch(() => '')
        return { label, status: r.status, ms: Math.round(performance.now() - t0), body: body.slice(0, 200) }
      } catch (e) {
        return { label, status: e.name === 'AbortError' ? 'timeout(6s)' : 'threw', ms: Math.round(performance.now() - t0), error: String(e.message || e) }
      } finally {
        clearTimeout(timer)
      }
    }

    let userId = '(no session)'
    let tokenLen = 0
    try {
      const { data: sessRes } = await supabase.auth.getSession()
      userId = sessRes?.session?.user?.id || '(no session)'
      tokenLen = sessRes?.session?.access_token?.length || 0
    } catch (_) {}

    const probes = await Promise.all([
      probe('control', 'https://www.gstatic.com/generate_204'),
      probe('supabase_auth_health', `${url}/auth/v1/health`, { headers: { apikey } }),
      probe('supabase_rest_root', `${url}/rest/v1/`, { headers: { apikey } }),
      probe('user_progress', `${url}/rest/v1/user_progress?select=current_grade,xp,student_name&user_id=eq.${userId}`, { headers: { apikey, Authorization: `Bearer ${apikey}` } }),
    ])

    setDiag({ userId, tokenLen, ua: navigator.userAgent.slice(0, 80), probes })
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-purple-100 to-yellow-50">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-6 text-center space-y-4">
        <div className="text-5xl">📡</div>
        <h1 className="font-black text-magic-700 text-xl">No pudimos cargar tu perfil</h1>
        <p className="text-gray-600 text-sm">
          Tu progreso está guardado en la nube. Esto puede pasar si tu
          sesión expiró o tu conexión es lenta.
        </p>

        {loadError && (
          <div className="text-left bg-orange-50 border border-orange-200 rounded-xl p-2 text-[11px] text-orange-700 font-mono break-words">
            {String(loadError)}
          </div>
        )}

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
            onClick={fullLogout}
            className="w-full bg-gray-100 text-gray-700 rounded-2xl py-2 text-sm font-bold"
          >
            🚪 Cerrar sesión y empezar limpio
          </button>
          <button
            type="button"
            onClick={runDiagnostic}
            className="w-full bg-white border border-gray-200 text-gray-500 rounded-2xl py-2 text-xs font-bold"
          >
            🔍 Ejecutar diagnóstico
          </button>
        </div>

        {diag && (
          <details open className="text-left bg-gray-50 rounded-xl p-2 text-[10px] font-mono">
            <summary className="cursor-pointer font-bold text-gray-700">
              Diagnóstico
            </summary>
            <pre className="whitespace-pre-wrap break-words mt-1 text-gray-700">
              {JSON.stringify(diag, null, 2)}
            </pre>
            <p className="mt-2 text-[10px] text-gray-500 font-sans">
              Compártele esto al equipo. Por probe:
              <br />· <b>control timeout</b> = sin internet
              <br />· solo supabase_* timeout = extensión/firewall bloquea supabase.co
              <br />· user_progress <b>401</b> = JWT, <b>403</b> = RLS, <b>404/[]</b> = sin fila
            </p>
          </details>
        )}
      </div>
    </div>
  )
}
