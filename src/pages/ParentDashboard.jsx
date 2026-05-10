import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { CURRICULUM, gradeLabel } from '../lib/curriculum'
import { sanitize } from '../lib/utils'

export default function ParentDashboard() {
  const { user, signOut } = useAuth()
  const [children, setChildren] = useState([])
  const [loading, setLoading] = useState(true)
  const [showLinkForm, setShowLinkForm] = useState(false)

  // New linking state
  const [childEmailInput, setChildEmailInput] = useState('')
  const [childCodeInput, setChildCodeInput] = useState('')
  const [linkError, setLinkError] = useState('')
  const [linkSuccess, setLinkSuccess] = useState('')
  const [linking, setLinking] = useState(false)

  // Password reset toast
  const [resetToast, setResetToast] = useState('')

  useEffect(() => { loadChildren() }, [user])

  async function loadChildren() {
    if (!user) return
    setLoading(true)
    try {
      const { data: links } = await supabase
        .from('parent_student_links')
        .select('student_id, child_email, child_name, status')
        .eq('parent_id', user.id)
        .eq('status', 'accepted')

      const accepted = links || []

      if (accepted.length > 0) {
        const studentIds = accepted.map(l => l.student_id)
        const { data: progresses } = await supabase
          .from('user_progress')
          .select('*')
          .in('user_id', studentIds)

        // Attach child_email from links to each progress row
        const enriched = (progresses || []).map(p => {
          const link = accepted.find(l => l.student_id === p.user_id)
          return { ...p, child_email: link?.child_email || '' }
        })

        setChildren(enriched)
      } else {
        setChildren([])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  async function linkChild() {
    setLinkError('')
    setLinkSuccess('')
    const email = sanitize.email(childEmailInput)
    const code = sanitize.code(childCodeInput)

    if (!email || !code) {
      setLinkError('Completa ambos campos.')
      return
    }

    setLinking(true)
    try {
      // 1. Find student by email in profiles
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('email', email)
        .single()

      if (profileError || !profile) {
        setLinkError('No encontramos una cuenta con ese correo.')
        setLinking(false)
        return
      }

      // 2. Check invite code matches
      const { data: prog, error: progError } = await supabase
        .from('user_progress')
        .select('invite_code, student_name, role')
        .eq('user_id', profile.id)
        .single()

      if (progError || !prog) {
        setLinkError('No se pudo verificar el estudiante.')
        setLinking(false)
        return
      }

      if (prog.role === 'parent') {
        setLinkError('Esa cuenta es de un apoderado, no de un estudiante.')
        setLinking(false)
        return
      }

      if (!prog.invite_code || prog.invite_code.toUpperCase() !== code.toUpperCase()) {
        setLinkError('El código no coincide. Pídele a tu hijo/a que te comparta su código desde su Perfil.')
        setLinking(false)
        return
      }

      // 3. Create or update link
      const { error: upsertError } = await supabase
        .from('parent_student_links')
        .upsert({
          parent_id: user.id,
          student_id: profile.id,
          child_email: email,
          child_name: prog.student_name || profile.full_name || 'Estudiante',
          status: 'accepted',
          verified_at: new Date().toISOString(),
        }, { onConflict: 'parent_id,student_id' })

      if (upsertError) {
        setLinkError('Error al vincular: ' + upsertError.message)
        setLinking(false)
        return
      }

      setLinkSuccess(`¡${prog.student_name || 'Estudiante'} vinculado/a correctamente!`)
      setChildEmailInput('')
      setChildCodeInput('')
      setShowLinkForm(false)
      loadChildren()
    } catch (e) {
      setLinkError('Error inesperado. Inténtalo de nuevo.')
    } finally {
      setLinking(false)
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

  const parentName = user?.user_metadata?.full_name?.split(' ')[0] || 'Apoderado'

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-teal-600 px-4 pt-12 pb-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-green-200 font-semibold text-sm">Panel de Apoderado</p>
            <h1 className="text-2xl font-black text-white">Hola, {parentName}! 👨‍👩‍👧</h1>
          </div>
          {user?.user_metadata?.avatar_url && (
            <img src={user.user_metadata.avatar_url} alt="avatar" className="w-12 h-12 rounded-full border-2 border-white" />
          )}
        </div>
      </div>

      {/* Reset toast */}
      {resetToast && (
        <div className="fixed top-4 left-4 right-4 z-50 bg-green-600 text-white rounded-2xl px-4 py-3 text-sm font-bold text-center shadow-lg">
          ✅ {resetToast}
        </div>
      )}

      <div className="px-4 py-4 space-y-4">
        {/* Children list */}
        {loading ? (
          <div className="text-center py-8 text-gray-400">Cargando...</div>
        ) : children.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center shadow-sm border border-green-100 space-y-3">
            <div className="text-5xl">👧</div>
            <p className="font-black text-gray-700 text-lg">Aún no tienes estudiantes vinculados</p>
            <p className="text-gray-500 text-sm">Para vincular a tu hijo/a:</p>
            <ol className="text-left text-sm text-gray-600 space-y-1 bg-green-50 rounded-2xl p-4 border border-green-100">
              <li><span className="font-bold text-green-700">1.</span> Pídele a tu hijo/a que abra la app y vaya a su <span className="font-bold">Perfil</span></li>
              <li><span className="font-bold text-green-700">2.</span> Pídele que comparta su <span className="font-bold">código de vinculación</span></li>
              <li><span className="font-bold text-green-700">3.</span> Ingresa su correo y código abajo</li>
            </ol>
          </div>
        ) : (
          children.map(p => (
            <ChildCard key={p.user_id} progress={p} onSendReset={sendPasswordReset} />
          ))
        )}

        {/* Success message */}
        {linkSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-2xl px-4 py-3 text-green-700 font-bold text-sm text-center">
            ✅ {linkSuccess}
          </div>
        )}

        {/* Link section */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-green-100 space-y-3">
          <h3 className="font-black text-gray-800">🔗 Agregar hijo/a</h3>

          {!showLinkForm ? (
            <button onClick={() => { setShowLinkForm(true); setLinkError(''); setLinkSuccess('') }}
              className="w-full bg-green-600 text-white rounded-2xl py-3 font-black text-sm flex items-center justify-center gap-2 active:scale-95">
              + Vincular estudiante
            </button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-500">Ingresa el correo y el código que tu hijo/a ve en su Perfil.</p>

              <input
                value={childEmailInput}
                onChange={e => setChildEmailInput(e.target.value)}
                placeholder="Correo del estudiante"
                type="email"
                maxLength={254}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-400"
              />

              <input
                value={childCodeInput}
                onChange={e => setChildCodeInput(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 7))}
                placeholder="Código del estudiante (ej: JV3-ZUN)"
                maxLength={7}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-mono tracking-widest uppercase focus:outline-none focus:border-green-400"
              />

              {linkError && (
                <p className="text-red-500 text-sm font-semibold">{linkError}</p>
              )}

              <div className="flex gap-2">
                <button
                  onClick={linkChild}
                  disabled={linking}
                  className="flex-1 bg-green-600 text-white rounded-xl py-3 font-bold text-sm disabled:opacity-50 active:scale-95"
                >
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

        {/* Sign out */}
        <button onClick={signOut} className="w-full text-red-400 font-bold py-3 text-sm">
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}

function ChildCard({ progress: p, onSendReset }) {
  if (!p) return null

  const completedCount = p.completed_topics?.length || 0
  const totalTopics = CURRICULUM.length
  const accuracy = p.exercises_total > 0 ? Math.round((p.correct_total / p.exercises_total) * 100) : 0
  const dailyPct = p.daily_goal > 0 ? Math.min(100, Math.round((p.daily_goal_done / p.daily_goal) * 100)) : 0

  return (
    <div className="bg-white rounded-3xl p-5 shadow-sm border border-green-100">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center text-xl border-2 border-purple-200 text-white font-black">
          {(p.student_name || '?')[0]?.toUpperCase()}
        </div>
        <div>
          <h3 className="font-black text-gray-800">{p.student_name || 'Estudiante'}</h3>
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

      {/* Daily goal progress */}
      <div className="mb-3">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Meta diaria</span>
          <span>{p.daily_goal_done || 0}/{p.daily_goal || 5} · {dailyPct}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-purple-400 to-pink-400 rounded-full transition-all"
            style={{ width: `${dailyPct}%` }} />
        </div>
      </div>

      {/* Curriculum progress */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Progreso del currículo</span>
          <span>{Math.round((completedCount / totalTopics) * 100)}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-green-400 to-teal-400 rounded-full transition-all"
            style={{ width: `${(completedCount / totalTopics) * 100}%` }} />
        </div>
      </div>

      {/* Password reset */}
      {p.child_email && (
        <button
          onClick={() => onSendReset(p.child_email)}
          className="w-full text-xs text-gray-400 border border-gray-200 rounded-xl py-2 font-semibold hover:bg-gray-50 active:scale-95 transition-all"
        >
          📧 Enviar reset de contraseña
        </button>
      )}
    </div>
  )
}
