import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { CURRICULUM, gradeLabel } from '../lib/curriculum'

export default function ParentDashboard() {
  const { user, signOut } = useAuth()
  const [children, setChildren] = useState([])
  const [loading, setLoading] = useState(true)
  const [inviteCode, setInviteCode] = useState('')
  const [childEmail, setChildEmail] = useState('')
  const [showInvite, setShowInvite] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)
  const [pendingLinks, setPendingLinks] = useState([])

  useEffect(() => { loadChildren() }, [user])

  async function loadChildren() {
    if (!user) return
    setLoading(true)
    try {
      // Fetch accepted links where I am the parent
      const { data: links } = await supabase
        .from('parent_student_links')
        .select('student_id, invite_code, status')
        .eq('parent_id', user.id)

      const allLinks = links || []
      const accepted = allLinks.filter(l => l.status === 'accepted')
      const pending = allLinks.filter(l => l.status === 'pending')
      setPendingLinks(pending)

      if (accepted.length > 0) {
        const studentIds = accepted.map(l => l.student_id)
        const { data: progresses } = await supabase
          .from('user_progress')
          .select('*')
          .in('user_id', studentIds)

        setChildren(progresses || [])
      } else {
        setChildren([])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  async function createInvite() {
    const { data } = await supabase
      .from('parent_student_links')
      .insert({ parent_id: user.id, student_email: childEmail || null })
      .select()
      .single()

    if (data) {
      setInviteCode(data.invite_code)
      loadChildren()
    }
  }

  async function copyCode(code) {
    await navigator.clipboard.writeText(code)
    setCopySuccess(true)
    setTimeout(() => setCopySuccess(false), 2000)
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
              <li><span className="font-bold text-green-700">1.</span> Copia tu código de invitación (abajo)</li>
              <li><span className="font-bold text-green-700">2.</span> Compártelo con tu hijo/a</li>
              <li><span className="font-bold text-green-700">3.</span> Tu hijo/a lo ingresa en <span className="font-bold">Perfil → Vincularme con mi apoderado</span></li>
            </ol>
          </div>
        ) : (
          children.map(p => (
            <ChildCard key={p.user_id} progress={p} />
          ))
        )}

        {/* Pending invites */}
        {pendingLinks.length > 0 && (
          <div className="bg-yellow-50 rounded-2xl p-4 border border-yellow-200">
            <h3 className="font-black text-yellow-800 mb-2">⏳ Invitaciones pendientes</h3>
            {pendingLinks.map(link => (
              <div key={link.invite_code} className="flex items-center justify-between py-2 border-b border-yellow-200 last:border-0">
                <span className="font-mono font-bold text-yellow-800 text-sm tracking-widest">{link.invite_code}</span>
                <button onClick={() => copyCode(link.invite_code)} className="text-yellow-600 text-xs">📋 Copiar</button>
              </div>
            ))}
          </div>
        )}

        {/* Invite section */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-green-100 space-y-3">
          <h3 className="font-black text-gray-800">🔗 Vincular otro hijo/a</h3>
          <p className="text-sm text-gray-500">Genera un código de invitación para tu hijo/a</p>

          {!showInvite ? (
            <button onClick={() => setShowInvite(true)}
              className="w-full bg-green-600 text-white rounded-2xl py-3 font-black text-sm flex items-center justify-center gap-2 active:scale-95">
              + Crear código de invitación
            </button>
          ) : (
            <>
              <input
                value={childEmail}
                onChange={e => setChildEmail(e.target.value)}
                placeholder="Email del estudiante (opcional)"
                type="email"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-400"
              />
              <div className="flex gap-2">
                <button onClick={createInvite}
                  className="flex-1 bg-green-600 text-white rounded-xl py-3 font-bold text-sm">
                  Generar código
                </button>
                <button onClick={() => setShowInvite(false)}
                  className="px-4 bg-gray-100 text-gray-600 rounded-xl font-bold text-sm">
                  Cancelar
                </button>
              </div>
              {inviteCode && (
                <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                  <p className="text-sm text-green-700 font-semibold mb-2">¡Código listo! Compártelo con tu hijo/a:</p>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-black text-green-800 font-mono tracking-widest">{inviteCode}</span>
                    <button onClick={() => copyCode(inviteCode)}
                      className="bg-green-600 text-white rounded-lg px-3 py-1 text-xs font-bold">
                      {copySuccess ? '✓' : 'Copiar'}
                    </button>
                  </div>
                  <p className="text-xs text-green-600 mt-2">El estudiante debe ingresar este código en su perfil</p>
                </div>
              )}
            </>
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

function ChildCard({ progress: p }) {
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
      <div>
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Progreso del currículo</span>
          <span>{Math.round((completedCount / totalTopics) * 100)}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-green-400 to-teal-400 rounded-full transition-all"
            style={{ width: `${(completedCount / totalTopics) * 100}%` }} />
        </div>
      </div>
    </div>
  )
}
