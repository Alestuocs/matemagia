import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { CURRICULUM } from '../lib/curriculum'

export default function ParentDashboard() {
  const { user, signOut } = useAuth()
  const [children, setChildren] = useState([])
  const [links, setLinks] = useState([])
  const [loading, setLoading] = useState(true)
  const [inviteCode, setInviteCode] = useState('')
  const [childEmail, setChildEmail] = useState('')
  const [showInvite, setShowInvite] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)

  useEffect(() => { loadChildren() }, [user])

  async function loadChildren() {
    if (!user) return
    setLoading(true)
    try {
      // Get parent's links
      const { data: linkData } = await supabase
        .from('parent_student_links')
        .select('*, student:student_id(id, full_name, avatar_url, email)')
        .eq('parent_id', user.id)

      setLinks(linkData || [])

      // Get progress for accepted children
      const accepted = (linkData || []).filter(l => l.status === 'accepted' && l.student_id)
      if (accepted.length > 0) {
        const { data: progressData } = await supabase
          .from('user_progress')
          .select('*')
          .in('user_id', accepted.map(l => l.student_id))

        const childrenWithProgress = accepted.map(link => ({
          ...link.student,
          progress: progressData?.find(p => p.user_id === link.student_id) || null
        }))
        setChildren(childrenWithProgress)
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
    const { data, error } = await supabase
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
        {/* Add child button */}
        <button onClick={() => setShowInvite(true)}
          className="w-full bg-green-600 text-white rounded-2xl py-4 font-black text-base flex items-center justify-center gap-2 active:scale-95">
          + Vincular hijo/a
        </button>

        {/* Invite modal */}
        {showInvite && (
          <div className="bg-white rounded-3xl p-5 shadow-lg border border-green-100">
            <h3 className="font-black text-gray-800 mb-3">Vincular estudiante</h3>
            <p className="text-sm text-gray-500 mb-3">Crea un código de invitación para tu hijo/a</p>
            <input
              value={childEmail}
              onChange={e => setChildEmail(e.target.value)}
              placeholder="Email del estudiante (opcional)"
              type="email"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm mb-3 focus:outline-none focus:border-green-400"
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
              <div className="mt-3 bg-green-50 rounded-xl p-4 border border-green-200">
                <p className="text-sm text-green-700 font-semibold mb-2">¡Código generado! Compártelo con tu hijo/a:</p>
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
          </div>
        )}

        {/* Pending invites */}
        {links.filter(l => l.status === 'pending').length > 0 && (
          <div className="bg-yellow-50 rounded-2xl p-4 border border-yellow-200">
            <h3 className="font-black text-yellow-800 mb-2">⏳ Invitaciones pendientes</h3>
            {links.filter(l => l.status === 'pending').map(link => (
              <div key={link.id} className="flex items-center justify-between py-2 border-b border-yellow-200 last:border-0">
                <span className="text-sm text-yellow-700">{link.student_email || 'Sin email'}</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-yellow-800 text-sm">{link.invite_code}</span>
                  <button onClick={() => copyCode(link.invite_code)} className="text-yellow-600 text-xs">📋</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Children */}
        {loading ? (
          <div className="text-center py-8 text-gray-400">Cargando...</div>
        ) : children.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center shadow-sm border border-green-100">
            <div className="text-5xl mb-3">👧</div>
            <p className="font-black text-gray-700">Aún no tienes estudiantes vinculados</p>
            <p className="text-gray-400 text-sm mt-1">Genera un código de invitación y compártelo</p>
          </div>
        ) : (
          children.map(child => (
            <ChildCard key={child.id} child={child} />
          ))
        )}

        {/* Sign out */}
        <button onClick={signOut} className="w-full text-red-400 font-bold py-3 text-sm">
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}

function ChildCard({ child }) {
  const p = child.progress
  if (!p) return null

  const completedCount = p.completed_topics?.length || 0
  const totalTopics = CURRICULUM.length
  const accuracy = p.exercises_total > 0 ? Math.round((p.correct_total / p.exercises_total) * 100) : 0

  return (
    <div className="bg-white rounded-3xl p-5 shadow-sm border border-green-100">
      <div className="flex items-center gap-3 mb-4">
        {child.avatar_url ? (
          <img src={child.avatar_url} alt={child.full_name} className="w-12 h-12 rounded-full border-2 border-green-200" />
        ) : (
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-xl border-2 border-green-200">🧒</div>
        )}
        <div>
          <h3 className="font-black text-gray-800">{p.student_name || child.full_name}</h3>
          <p className="text-sm text-gray-500">{p.current_grade}ro Básico · {p.xp} XP</p>
        </div>
        <div className="ml-auto text-right">
          <div className="text-orange-500 font-black">🔥 {p.streak || 0}</div>
          <div className="text-xs text-gray-400">días seguidos</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          { label: 'Temas', value: `${completedCount}/${totalTopics}`, color: 'purple' },
          { label: 'Ejercicios', value: p.exercises_total || 0, color: 'blue' },
          { label: 'Precisión', value: `${accuracy}%`, color: 'green' },
        ].map(stat => (
          <div key={stat.label} className={`bg-${stat.color}-50 rounded-xl p-3 text-center`}>
            <div className={`text-xl font-black text-${stat.color}-700`}>{stat.value}</div>
            <div className="text-xs text-gray-500 font-semibold">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Progress bar */}
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
