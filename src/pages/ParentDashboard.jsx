import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useProgress } from '../contexts/ProgressContext'
import { CURRICULUM, gradeLabel } from '../lib/curriculum'
import { sanitize } from '../lib/utils'
import LinkingCodes from '../components/ui/LinkingCodes'

const LINK_ERRORS = {
  CODE_NOT_FOUND: 'No encontramos ningún estudiante con ese código.',
  INVALID_CODE_FORMAT: 'El código debe tener el formato XXX-XXX.',
  SAME_ROLE_CANNOT_LINK: 'Ese código pertenece a otra cuenta de apoderado.',
  CANNOT_LINK_SELF: 'No puedes vincularte contigo mismo/a.',
  NOT_AUTHENTICATED: 'Tu sesión expiró. Vuelve a iniciar sesión.',
}

export default function ParentDashboard() {
  const { user, signOut } = useAuth()
  const { progress } = useProgress()
  const [children, setChildren] = useState([])
  const [loading, setLoading] = useState(true)
  const [showLinkForm, setShowLinkForm] = useState(false)

  const [codeInput, setCodeInput] = useState('')
  const [linkError, setLinkError] = useState('')
  const [linkSuccess, setLinkSuccess] = useState('')
  const [linking, setLinking] = useState(false)

  const [resetToast, setResetToast] = useState('')
  const [codeCopied, setCodeCopied] = useState(false)

  const myCode = progress.inviteCode || ''

  useEffect(() => { loadChildren() }, [user])

  async function loadChildren() {
    if (!user) return
    setLoading(true)
    try {
      const { data: partners, error: partErr } = await supabase.rpc('my_linked_partners')
      if (partErr) throw partErr
      const studentPartners = (partners || []).filter(p => p.partner_role === 'student')

      if (studentPartners.length === 0) {
        setChildren([])
        return
      }

      const { data: progresses, error: progErr } = await supabase
        .rpc('my_children_progress')
      if (progErr) throw progErr

      const enriched = (progresses || []).map(p => {
        const partner = studentPartners.find(sp => sp.partner_id === p.user_id)
        return {
          ...p,
          child_email: partner?.partner_email || '',
          partner_name: partner?.partner_name || p.student_name || 'Estudiante',
        }
      })
      setChildren(enriched)
    } catch (e) {
      console.error('loadChildren error:', e)
    } finally {
      setLoading(false)
    }
  }

  async function linkChild() {
    setLinkError(''); setLinkSuccess('')
    const code = sanitize.code(codeInput)
    if (!code || code.length < 6) {
      setLinkError('Ingresa el código completo (formato XXX-XXX).')
      return
    }

    setLinking(true)
    try {
      const { data, error } = await supabase.rpc('link_by_invite_code', { target_code: code })
      if (error) {
        const key = (error.message || '').match(/BETA_NOT_ALLOWED|CODE_NOT_FOUND|INVALID_CODE_FORMAT|SAME_ROLE_CANNOT_LINK|CANNOT_LINK_SELF|NOT_AUTHENTICATED/)?.[0]
        setLinkError(LINK_ERRORS[key] || 'No se pudo vincular. Verifica el código.')
        return
      }
      setLinkSuccess(`¡${data?.partner_name || 'Estudiante'} vinculado/a correctamente! 🎉`)
      setCodeInput('')
      setShowLinkForm(false)
      loadChildren()
    } catch (e) {
      setLinkError('Error inesperado. Inténtalo de nuevo.')
    } finally {
      setLinking(false)
    }
  }

  async function unlinkChild(studentId) {
    if (!window.confirm('¿Quitar la vinculación con este estudiante?')) return
    try {
      await supabase.rpc('unlink_partner', { partner: studentId })
      loadChildren()
    } catch (e) {
      console.error(e)
    }
  }

  async function sendPasswordReset(childEmail) {
    if (!childEmail) return
    await supabase.auth.resetPasswordForEmail(childEmail, {
      redirectTo: window.location.origin + '/matemagia/',
    })
    setResetToast('Correo de recuperación enviado a ' + childEmail)
    setTimeout(() => setResetToast(''), 4000)
  }

  async function copyMyCode() {
    if (!myCode) return
    try {
      await navigator.clipboard.writeText(myCode)
      setCodeCopied(true)
      setTimeout(() => setCodeCopied(false), 2000)
    } catch (_) {}
  }

  const parentName = progress.studentName || user?.user_metadata?.full_name?.split(' ')[0] || 'Apoderado'

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-teal-600 px-4 pt-12 pb-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-green-200 font-semibold text-sm">Panel de Apoderado</p>
            <h1 className="text-2xl font-black text-white">¡Hola, {parentName}! 👨‍👩‍👧</h1>
          </div>
          <div className="flex items-center gap-2">
            {user?.user_metadata?.avatar_url && (
              <img src={user.user_metadata.avatar_url} alt="avatar" className="w-10 h-10 rounded-full border-2 border-white" />
            )}
            <button
              type="button"
              onClick={async () => { try { await signOut() } catch (_) {} }}
              className="bg-white/15 hover:bg-white/25 border border-white/30 text-white text-xs font-bold rounded-xl px-3 py-2 active:scale-95 transition"
              title="Cerrar sesión"
            >
              🚪
            </button>
          </div>
        </div>
      </div>

      {resetToast && (
        <div className="fixed top-4 left-4 right-4 z-50 bg-green-600 text-white rounded-2xl px-4 py-3 text-sm font-bold text-center shadow-lg">
          ✅ {resetToast}
        </div>
      )}

      <div className="px-4 py-4 space-y-4">
        {/* Discreet linking codes panel — shows both "my code" and
            "add by code" in a compact layout. */}
        <LinkingCodes otherRoleLabel="estudiante" />

        {/* Children list */}
        {loading ? (
          <div className="text-center py-8 text-gray-400">Cargando estudiantes...</div>
        ) : children.length === 0 ? (
          <div className="bg-white rounded-3xl p-6 text-center shadow-sm border border-green-100 space-y-3">
            <div className="text-5xl">👧</div>
            <p className="font-black text-gray-700 text-lg">Aún no hay estudiantes vinculados</p>
            <p className="text-gray-500 text-sm">Hay dos formas de vincular:</p>
            <ol className="text-left text-sm text-gray-600 space-y-2 bg-green-50 rounded-2xl p-4 border border-green-100">
              <li><span className="font-bold text-green-700">A.</span> Comparte <span className="font-bold">TU código</span> (arriba) con tu hijo/a, y que lo ingrese desde su <span className="font-bold">Perfil → Vincular apoderado</span>.</li>
              <li><span className="font-bold text-green-700">B.</span> Pide a tu hijo/a su código (lo ve en su Perfil) e ingrésalo abajo.</li>
            </ol>
          </div>
        ) : (
          children.map(p => (
            <ChildCard key={p.user_id} progress={p} onSendReset={sendPasswordReset} onUnlink={unlinkChild} onReload={loadChildren} />
          ))
        )}

        <button
          type="button"
          onClick={signOut}
          className="w-full bg-red-50 text-red-500 border border-red-200 rounded-2xl py-3 font-bold text-sm active:scale-95"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}

function ChildCard({ progress: p, onSendReset, onUnlink, onReload }) {
  const { recoverProgress, recovering } = useProgress()
  const [stats, setStats] = useState(null)
  const [statsErr, setStatsErr] = useState('')
  const [statsLoading, setStatsLoading] = useState(false)
  const [showStats, setShowStats] = useState(false)
  const [recoverNote, setRecoverNote] = useState('')

  if (!p) return null

  const completedCount = p.completed_topics?.length || 0
  const totalTopics = CURRICULUM.length
  const accuracy = p.exercises_total > 0 ? Math.round((p.correct_total / p.exercises_total) * 100) : 0
  const dailyPct = p.daily_goal > 0 ? Math.min(100, Math.round((p.daily_goal_done / p.daily_goal) * 100)) : 0
  const displayName = p.student_name || p.partner_name || 'Estudiante'

  async function loadStats() {
    setShowStats(v => !v)
    if (stats) return
    setStatsLoading(true); setStatsErr('')
    try {
      const { data, error } = await supabase.rpc('child_stats', { child: p.user_id })
      if (error) throw error
      setStats(data || {})
    } catch (e) {
      setStatsErr(e.message || 'Error al cargar estadísticas.')
    } finally {
      setStatsLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-3xl p-5 shadow-sm border border-green-100">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center text-xl border-2 border-purple-200 text-white font-black">
          {displayName[0]?.toUpperCase() || '?'}
        </div>
        <div>
          <h3 className="font-black text-gray-800">{displayName}</h3>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="bg-purple-100 text-purple-700 font-bold text-xs px-2 py-0.5 rounded-full">
              {gradeLabel(p.current_grade || 1)} Básico
            </span>
            <span className="text-xs text-gray-400">⭐ {p.xp || 0} XP</span>
          </div>
        </div>
        <div className="ml-auto text-right">
          <div className="text-orange-500 font-black">🔥 {p.streak || 0}</div>
          <div className="text-xs text-gray-400">días</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-purple-50 rounded-xl p-3 text-center">
          <div className="text-xl font-black text-purple-700">{completedCount}/{totalTopics}</div>
          <div className="text-xs text-gray-500 font-semibold">Temas</div>
        </div>
        <div className="bg-blue-50 rounded-xl p-3 text-center">
          <div className="text-xl font-black text-blue-700">{p.exercises_total || 0}</div>
          <div className="text-xs text-gray-500 font-semibold">Ejercicios</div>
        </div>
        <div className="bg-green-50 rounded-xl p-3 text-center">
          <div className="text-xl font-black text-green-700">{accuracy}%</div>
          <div className="text-xs text-gray-500 font-semibold">Precisión</div>
        </div>
      </div>

      <div className="mb-3">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Meta diaria</span>
          <span>{p.daily_goal_done || 0}/{p.daily_goal || 5} · {dailyPct}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-purple-400 to-pink-400 rounded-full transition-all" style={{ width: `${dailyPct}%` }} />
        </div>
      </div>

      <div className="mb-4">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Progreso del currículo</span>
          <span>{Math.round((completedCount / totalTopics) * 100)}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-green-400 to-teal-400 rounded-full transition-all" style={{ width: `${(completedCount / totalTopics) * 100}%` }} />
        </div>
      </div>

      <button
        onClick={loadStats}
        className="w-full mb-2 text-xs font-bold text-green-700 bg-green-50 border border-green-200 rounded-xl py-2 active:scale-95 transition-all"
      >
        {showStats ? '🙈 Ocultar estadísticas' : '📊 Ver estadísticas detalladas'}
      </button>

      {showStats && (
        <div className="mb-3 rounded-2xl border border-green-100 bg-green-50/40 p-3 space-y-3">
          {statsLoading && <p className="text-xs text-gray-500 text-center">Cargando datos desde la BD…</p>}
          {statsErr && <p className="text-xs text-red-500 text-center">{statsErr}</p>}
          {stats && (
            <>
              <ActivityHeatmap days={stats.last_14_days || []} />
              <WorstTopics worst={stats.worst_topics || []} />
              <TopicAccuracyList byTopic={stats.by_topic || {}} />
              <p className="text-[10px] text-gray-400 text-center">
                {stats.total_attempts || 0} intentos totales · {stats.correct_attempts || 0} correctos · datos en vivo desde la base.
              </p>
            </>
          )}
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={async () => {
            const r = await recoverProgress(p.user_id)
            if (!r) return
            if (r.error) setRecoverNote(`Error: ${r.error}`)
            else if (r.recovered) {
              setRecoverNote(`✅ Recuperados: ${r.after?.xp} XP · ${r.after?.exercises_total} ejercicios`)
              if (onReload) onReload()
            } else {
              setRecoverNote('Sin cambios — el progreso ya estaba al día.')
            }
            setTimeout(() => setRecoverNote(''), 5000)
          }}
          disabled={recovering}
          className="flex-1 text-xs text-purple-600 border border-purple-200 rounded-xl py-2 font-semibold hover:bg-purple-50 active:scale-95 transition-all disabled:opacity-60"
        >
          {recovering ? 'Recalculando…' : '🛟 Recalcular'}
        </button>
        {p.child_email && (
          <button onClick={() => onSendReset(p.child_email)}
            className="flex-1 text-xs text-gray-500 border border-gray-200 rounded-xl py-2 font-semibold hover:bg-gray-50 active:scale-95 transition-all">
            📧 Reset
          </button>
        )}
        <button onClick={() => onUnlink(p.user_id)}
          className="px-3 text-xs text-red-500 border border-red-200 rounded-xl py-2 font-semibold hover:bg-red-50 active:scale-95 transition-all">
          Desvincular
        </button>
      </div>
      {recoverNote && (
        <p className="mt-2 text-[11px] text-gray-600 bg-gray-50 rounded-xl p-2">{recoverNote}</p>
      )}
    </div>
  )
}

function ActivityHeatmap({ days }) {
  // Build a fixed 14-day window (today and 13 previous). Missing days = 0.
  const today = new Date()
  const grid = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(today.getTime() - (13 - i) * 86400000)
    const iso = d.toISOString().slice(0, 10)
    const hit = days.find(x => x.day === iso)
    return {
      iso,
      label: d.getDate(),
      attempts: hit?.attempts || 0,
      correct: hit?.correct || 0,
    }
  })
  const max = Math.max(1, ...grid.map(g => g.attempts))
  return (
    <div>
      <h4 className="font-black text-xs text-gray-700 mb-2">📅 Actividad últimos 14 días</h4>
      <div className="grid grid-cols-7 gap-1">
        {grid.map(d => {
          const intensity = d.attempts === 0 ? 0 : 0.2 + 0.8 * (d.attempts / max)
          const bg = d.attempts === 0
            ? 'rgba(0,0,0,0.06)'
            : `rgba(34,197,94,${intensity.toFixed(2)})`
          return (
            <div
              key={d.iso}
              title={`${d.iso} · ${d.attempts} intentos (${d.correct} correctos)`}
              className="aspect-square rounded-md text-[10px] flex items-center justify-center font-bold text-gray-700"
              style={{ background: bg }}
            >
              {d.label}
            </div>
          )
        })}
      </div>
      <div className="flex justify-between text-[10px] text-gray-400 mt-1">
        <span>menos</span>
        <span>más actividad</span>
      </div>
    </div>
  )
}

function WorstTopics({ worst }) {
  if (!worst?.length) {
    return (
      <div className="bg-white rounded-xl p-3 text-center text-xs text-gray-400">
        ✅ No hay temas con muchos errores. ¡Buen trabajo!
      </div>
    )
  }
  return (
    <div>
      <h4 className="font-black text-xs text-gray-700 mb-2">⚠️ Temas con más errores</h4>
      <div className="space-y-1">
        {worst.map(w => {
          const t = CURRICULUM.find(t => t.id === w.topic_id)
          return (
            <div key={w.topic_id} className="bg-white rounded-xl p-2 flex items-center gap-2 text-xs">
              <span className="text-base">{t?.icon || '📘'}</span>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-gray-700 truncate">{t?.title || w.topic_id}</div>
                <div className="text-[10px] text-gray-400">
                  {w.attempts} intentos · {w.wrong} errores · {w.accuracy}% acierto
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function TopicAccuracyList({ byTopic }) {
  const entries = Object.entries(byTopic || {})
  if (!entries.length) return null
  // Sort by attempts desc, top 8
  const top = entries
    .map(([topicId, info]) => ({ topicId, ...info }))
    .sort((a, b) => b.attempts - a.attempts)
    .slice(0, 8)
  return (
    <div>
      <h4 className="font-black text-xs text-gray-700 mb-2">🎯 Precisión por tema (top 8)</h4>
      <div className="space-y-1">
        {top.map(row => {
          const t = CURRICULUM.find(t => t.id === row.topicId)
          const acc = row.attempts > 0 ? Math.round((row.correct / row.attempts) * 100) : 0
          const color = acc >= 80 ? 'bg-green-500' : acc >= 60 ? 'bg-yellow-500' : 'bg-red-500'
          return (
            <div key={row.topicId} className="bg-white rounded-xl p-2">
              <div className="flex items-center justify-between text-xs">
                <span className="truncate font-bold text-gray-700 flex items-center gap-1">
                  <span>{t?.icon || '📘'}</span>
                  <span className="truncate">{t?.title || row.topicId}</span>
                </span>
                <span className="text-gray-500 text-[10px] shrink-0">{row.correct}/{row.attempts}</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mt-1">
                <div className={`h-full ${color}`} style={{ width: `${acc}%` }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
