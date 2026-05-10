import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useProgress } from '../contexts/ProgressContext'
import { getLevelInfo, GRADE_LABELS, CURRICULUM } from '../lib/curriculum'
import { supabase } from '../lib/supabase'
import TopBar from '../components/layout/TopBar'

export default function ProfilePage() {
  const { user, signOut } = useAuth()
  const { progress, setDailyGoal } = useProgress()
  const [showGoalPicker, setShowGoalPicker] = useState(false)
  const [inviteCode, setInviteCode] = useState('')
  const [linkStatus, setLinkStatus] = useState(null) // null | 'success' | 'error' | 'loading'
  const [linkMessage, setLinkMessage] = useState('')
  const [linkedParents, setLinkedParents] = useState([])

  const { current, next, progress: levelProgress } = getLevelInfo(progress.xp)
  const name = progress.studentName || user?.user_metadata?.full_name || 'Estudiante'
  const avatar = user?.user_metadata?.avatar_url
  const correctRate = progress.exercisesTotal > 0
    ? Math.round((progress.correctTotal / progress.exercisesTotal) * 100) : 0

  const isStudent = progress.role !== 'parent'
  const isParent = progress.role === 'parent'

  // Load linked parents for students
  useEffect(() => {
    if (!user || !isStudent) return
    async function loadLinks() {
      const { data } = await supabase
        .from('parent_student_links')
        .select('id, status, invite_code, parent_id')
        .eq('student_id', user.id)
        .eq('status', 'accepted')
      setLinkedParents(data || [])
    }
    loadLinks()
  }, [user?.id, isStudent])

  async function handleSignOut() {
    try { await signOut() } catch (e) { console.error(e) }
  }

  async function handleLinkInvite() {
    const code = inviteCode.trim().toUpperCase()
    if (!code) return
    setLinkStatus('loading')
    try {
      const { data: link, error } = await supabase
        .from('parent_student_links')
        .select('id, status')
        .eq('invite_code', code)
        .eq('status', 'pending')
        .single()

      if (error || !link) {
        setLinkStatus('error')
        setLinkMessage('Código no encontrado o ya usado.')
        return
      }

      const { error: updateError } = await supabase
        .from('parent_student_links')
        .update({ student_id: user.id, status: 'accepted' })
        .eq('id', link.id)

      if (updateError) {
        setLinkStatus('error')
        setLinkMessage('No se pudo vincular. Inténtalo de nuevo.')
        return
      }

      setLinkStatus('success')
      setLinkMessage('¡Cuenta vinculada con tu apoderado!')
      setInviteCode('')
      // Refresh linked parents list
      setLinkedParents(prev => [...prev, { id: link.id, status: 'accepted' }])
    } catch (e) {
      setLinkStatus('error')
      setLinkMessage('Error al vincular. Inténtalo de nuevo.')
    }
  }

  return (
    <div className="pb-24">
      <TopBar title="Mi perfil" showBack={false} />
      <div className="px-4 max-w-lg mx-auto mt-4 space-y-4">

        {/* Profile card */}
        <div className="card bg-gradient-to-br from-magic-50 to-purple-100 border-magic-200 text-center py-6">
          {avatar ? (
            <img src={avatar} alt={name} className="w-20 h-20 rounded-full mx-auto border-4 border-white shadow-lg mb-3" />
          ) : (
            <div className="w-20 h-20 rounded-full mx-auto bg-magic-200 flex items-center justify-center text-4xl border-4 border-white shadow-lg mb-3">
              {name[0]?.toUpperCase()}
            </div>
          )}
          <h2 className="text-xl font-black text-gray-800">{name}</h2>

          {/* Role badge */}
          <div className="mt-2 inline-flex items-center gap-2 bg-white rounded-full px-4 py-1 shadow text-sm font-bold border border-magic-100">
            {isParent ? (
              <><span>👨‍👩‍👧</span><span className="text-green-700">Apoderado</span></>
            ) : (
              <><span>🎒</span><span className="text-magic-700">Estudiante</span></>
            )}
          </div>

          {isStudent && (
            <p className="text-gray-500 font-semibold text-sm mt-2">{GRADE_LABELS[progress.currentGrade] || '1ro Básico'}</p>
          )}

          {isStudent && (
            <div className="mt-3 inline-flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow">
              <span className="text-xl">{current.icon}</span>
              <span className="font-black text-magic-700">{current.title}</span>
            </div>
          )}
        </div>

        {/* Student-only: XP bar */}
        {isStudent && (
          <div className="card">
            <div className="flex justify-between mb-2 font-bold text-sm text-gray-500">
              <span>{current.icon} {current.title}</span>
              <span>{progress.xp} XP</span>
            </div>
            <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-magic-500 to-primary-500 rounded-full transition-all duration-700"
                style={{ width: `${levelProgress}%` }}
              />
            </div>
            {next && <p className="text-xs text-gray-400 mt-1 text-right">Próximo nivel: {next.icon} {next.title}</p>}
          </div>
        )}

        {/* Student stats */}
        {isStudent && (
          <div className="grid grid-cols-2 gap-3">
            <div className="card text-center">
              <div className="text-3xl font-black text-magic-600">{progress.xp}</div>
              <div className="text-xs text-gray-400 font-semibold">XP total</div>
            </div>
            <div className="card text-center">
              <div className="text-3xl font-black text-orange-500">🔥{progress.streak}</div>
              <div className="text-xs text-gray-400 font-semibold">Racha actual</div>
            </div>
            <div className="card text-center">
              <div className="text-3xl font-black text-green-500">{progress.completedTopics.length}</div>
              <div className="text-xs text-gray-400 font-semibold">Temas hechos</div>
            </div>
            <div className="card text-center">
              <div className="text-3xl font-black text-blue-500">{progress.exercisesTotal}</div>
              <div className="text-xs text-gray-400 font-semibold">Ejercicios</div>
            </div>
            <div className="card text-center">
              <div className="text-3xl font-black text-primary-500">{correctRate}%</div>
              <div className="text-xs text-gray-400 font-semibold">Aciertos</div>
            </div>
            <div className="card text-center">
              <div className="text-3xl font-black text-yellow-500">{progress.achievements.length}</div>
              <div className="text-xs text-gray-400 font-semibold">Logros</div>
            </div>
          </div>
        )}

        {/* Daily goal (students only) */}
        {isStudent && (
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-black text-gray-700">🎯 Meta diaria</h3>
                <p className="text-gray-400 text-sm">{progress.dailyGoal} ejercicios por día</p>
              </div>
              <button
                onClick={() => setShowGoalPicker(!showGoalPicker)}
                className="btn-ghost text-sm py-2 px-3"
              >
                Cambiar
              </button>
            </div>
            {showGoalPicker && (
              <div className="mt-3 flex flex-wrap gap-2">
                {[3, 5, 10, 15, 20].map(g => (
                  <button
                    key={g}
                    onClick={() => { setDailyGoal(g); setShowGoalPicker(false) }}
                    className={`px-4 py-2 rounded-xl font-bold transition-all ${
                      progress.dailyGoal === g
                        ? 'bg-magic-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-magic-100'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Grade progress (students only) */}
        {isStudent && (
          <div className="card">
            <h3 className="font-black text-gray-700 mb-3">📊 Progreso por grado</h3>
            {[1, 2, 3, 4, 5, 6].map(g => {
              const topics = CURRICULUM.filter(t => t.gradeLevel === g)
              const done = topics.filter(t => progress.completedTopics.includes(t.id)).length
              const pct = Math.round((done / topics.length) * 100)
              return (
                <div key={g} className="mb-2">
                  <div className="flex justify-between text-xs font-bold text-gray-500 mb-1">
                    <span>{GRADE_LABELS[g]}</span>
                    <span>{done}/{topics.length}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-magic-400 to-primary-400 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Link to parent (students only) */}
        {isStudent && (
          <div className="card border-2 border-magic-200 bg-magic-50">
            <h3 className="font-black text-gray-800 mb-1 text-base">
              👨‍👩‍👧 Vincularme con mi apoderado
            </h3>
            <p className="text-gray-500 text-sm mb-3">
              Ingresa el código de tu apoderado para vincularte. Tu apoderado puede ver tu progreso desde su cuenta.
            </p>

            {linkedParents.length > 0 && (
              <div className="mb-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                <p className="text-green-700 font-bold text-sm">
                  Vinculado con {linkedParents.length} apoderado{linkedParents.length > 1 ? 's' : ''}
                </p>
                <p className="text-green-600 text-xs mt-0.5">Tu apoderado puede ver tu progreso</p>
              </div>
            )}

            <div className="flex gap-2">
              <input
                value={inviteCode}
                onChange={e => setInviteCode(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && handleLinkInvite()}
                placeholder="Ej: AB12CD34"
                maxLength={8}
                className="flex-1 border-2 border-magic-300 rounded-xl px-4 py-3 text-base font-black text-center tracking-widest focus:outline-none focus:border-magic-500 font-mono uppercase bg-white"
              />
              <button
                onClick={handleLinkInvite}
                disabled={!inviteCode.trim() || linkStatus === 'loading'}
                className="bg-magic-500 text-white rounded-xl px-5 font-bold text-sm disabled:opacity-50 active:scale-95 whitespace-nowrap"
              >
                {linkStatus === 'loading' ? '...' : 'Vincular'}
              </button>
            </div>
            {linkStatus === 'success' && (
              <p className="mt-2 text-green-600 text-sm font-semibold">{linkMessage}</p>
            )}
            {linkStatus === 'error' && (
              <p className="mt-2 text-red-500 text-sm font-semibold">{linkMessage}</p>
            )}
          </div>
        )}

        <button onClick={handleSignOut} className="btn-ghost w-full text-red-500 border-red-200">
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}
