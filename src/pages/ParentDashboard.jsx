import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useProgress } from '../contexts/ProgressContext'
import { CURRICULUM, gradeLabel } from '../lib/curriculum'
import { sanitize } from '../lib/utils'

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
          {user?.user_metadata?.avatar_url && (
            <img src={user.user_metadata.avatar_url} alt="avatar" className="w-12 h-12 rounded-full border-2 border-white" />
          )}
        </div>
      </div>

      {resetToast && (
        <div className="fixed top-4 left-4 right-4 z-50 bg-green-600 text-white rounded-2xl px-4 py-3 text-sm font-bold text-center shadow-lg">
          ✅ {resetToast}
        </div>
      )}

      <div className="px-4 py-4 space-y-4">
        {/* My code card — parent's code that students can use to link */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border-2 border-green-200">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">🔑</span>
            <h3 className="font-black text-gray-800">Tu código de apoderado</h3>
          </div>
          <p className="text-gray-500 text-sm mb-3">
            Comparte este código con tu hijo/a. Desde su perfil, puede ingresarlo para vincular sus cuentas.
          </p>
          {myCode ? (
            <div className="bg-green-50 border-2 border-green-300 rounded-2xl p-4 text-center">
              <div className="text-3xl font-black tracking-widest text-green-700 font-mono mb-3">
                {myCode}
              </div>
              <button onClick={copyMyCode}
                className="bg-green-600 text-white rounded-xl px-5 py-2 font-bold text-sm active:scale-95 transition-all">
                {codeCopied ? '✅ Copiado' : '📋 Copiar código'}
              </button>
            </div>
          ) : (
            <div className="text-center text-gray-400 py-3 text-sm">Cargando código...</div>
          )}
        </div>

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
            <ChildCard key={p.user_id} progress={p} onSendReset={sendPasswordReset} onUnlink={unlinkChild} />
          ))
        )}

        {linkSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-2xl px-4 py-3 text-green-700 font-bold text-sm text-center">
            ✅ {linkSuccess}
          </div>
        )}

        {/* Add child by their code */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-green-100 space-y-3">
          <h3 className="font-black text-gray-800">🔗 Vincular con código del estudiante</h3>
          {!showLinkForm ? (
            <button onClick={() => { setShowLinkForm(true); setLinkError(''); setLinkSuccess('') }}
              className="w-full bg-green-600 text-white rounded-2xl py-3 font-black text-sm flex items-center justify-center gap-2 active:scale-95">
              + Agregar estudiante por código
            </button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-500">Pídele a tu hijo/a el código que aparece en su Perfil (formato XXX-XXX).</p>
              <input
                value={codeInput}
                onChange={e => setCodeInput(sanitize.code(e.target.value))}
                placeholder="Código del estudiante (ej: JV3-ZUN)"
                maxLength={7}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base font-mono tracking-widest uppercase text-center focus:outline-none focus:border-green-400"
              />
              {linkError && (
                <p className="text-red-500 text-sm font-semibold">{linkError}</p>
              )}
              <div className="flex gap-2">
                <button onClick={linkChild} disabled={linking}
                  className="flex-1 bg-green-600 text-white rounded-xl py-3 font-bold text-sm disabled:opacity-50 active:scale-95">
                  {linking ? 'Verificando...' : 'Vincular'}
                </button>
                <button onClick={() => { setShowLinkForm(false); setLinkError('') }}
                  className="px-4 bg-gray-100 text-gray-600 rounded-xl font-bold text-sm">
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>

        <button onClick={signOut} className="w-full text-red-400 font-bold py-3 text-sm">
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}

function ChildCard({ progress: p, onSendReset, onUnlink }) {
  if (!p) return null

  const completedCount = p.completed_topics?.length || 0
  const totalTopics = CURRICULUM.length
  const accuracy = p.exercises_total > 0 ? Math.round((p.correct_total / p.exercises_total) * 100) : 0
  const dailyPct = p.daily_goal > 0 ? Math.min(100, Math.round((p.daily_goal_done / p.daily_goal) * 100)) : 0
  const displayName = p.student_name || p.partner_name || 'Estudiante'

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

      <div className="flex gap-2">
        {p.child_email && (
          <button onClick={() => onSendReset(p.child_email)}
            className="flex-1 text-xs text-gray-500 border border-gray-200 rounded-xl py-2 font-semibold hover:bg-gray-50 active:scale-95 transition-all">
            📧 Reset contraseña
          </button>
        )}
        <button onClick={() => onUnlink(p.user_id)}
          className="px-3 text-xs text-red-500 border border-red-200 rounded-xl py-2 font-semibold hover:bg-red-50 active:scale-95 transition-all">
          Desvincular
        </button>
      </div>
    </div>
  )
}
