import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useProgress } from '../contexts/ProgressContext'
import { getLevelInfo, GRADE_LABELS, CURRICULUM } from '../lib/curriculum'
import { supabase } from '../lib/supabase'
import { sanitize } from '../lib/utils'
import TopBar from '../components/layout/TopBar'
import LinkingCodes from '../components/ui/LinkingCodes'

const LINK_ERRORS = {
  CODE_NOT_FOUND: 'No encontramos ningún apoderado con ese código.',
  INVALID_CODE_FORMAT: 'El código debe tener el formato XXX-XXX.',
  SAME_ROLE_CANNOT_LINK: 'Ese código pertenece a otra cuenta de estudiante.',
  CANNOT_LINK_SELF: 'No puedes vincularte contigo mismo/a.',
  NOT_AUTHENTICATED: 'Tu sesión expiró. Vuelve a iniciar sesión.',
}

export default function ProfilePage() {
  const { user, signOut } = useAuth()
  const { progress, setDailyGoal, inviteCode, recoverProgress, recovering } = useProgress()
  const [recoverResult, setRecoverResult] = useState(null)
  const [showGoalPicker, setShowGoalPicker] = useState(false)
  const [codeCopied, setCodeCopied] = useState(false)

  // Linked parents state
  const [linkedParents, setLinkedParents] = useState([])
  const [loadingLinks, setLoadingLinks] = useState(true)
  const [parentCodeInput, setParentCodeInput] = useState('')
  const [showLinkForm, setShowLinkForm] = useState(false)
  const [linkError, setLinkError] = useState('')
  const [linkSuccess, setLinkSuccess] = useState('')
  const [linking, setLinking] = useState(false)

  const { current, next, progress: levelProgress } = getLevelInfo(progress.xp)
  const name = progress.studentName || user?.user_metadata?.full_name || 'Estudiante'
  const avatar = user?.user_metadata?.avatar_url
  const correctRate = progress.exercisesTotal > 0
    ? Math.round((progress.correctTotal / progress.exercisesTotal) * 100) : 0

  const isStudent = progress.role !== 'parent'
  const isParent = progress.role === 'parent'

  async function handleSignOut() {
    try { await signOut() } catch (e) { console.error(e) }
  }

  async function handleCopyCode() {
    const code = inviteCode || progress.inviteCode
    if (!code) return
    try {
      await navigator.clipboard.writeText(code)
      setCodeCopied(true)
      setTimeout(() => setCodeCopied(false), 2000)
    } catch (_) {}
  }

  useEffect(() => {
    if (!user) return
    loadLinkedParents()
  }, [user])

  async function loadLinkedParents() {
    setLoadingLinks(true)
    try {
      const { data, error } = await supabase.rpc('my_linked_partners')
      if (error) throw error
      const parents = (data || []).filter(p => p.partner_role === 'parent')
      setLinkedParents(parents)
    } catch (e) {
      console.warn('loadLinkedParents error', e)
    } finally {
      setLoadingLinks(false)
    }
  }

  async function linkParent() {
    setLinkError(''); setLinkSuccess('')
    const code = sanitize.code(parentCodeInput)
    if (!code || code.length < 6) {
      setLinkError('Ingresa el código completo (formato XXX-XXX).')
      return
    }
    setLinking(true)
    try {
      const { data, error } = await supabase.rpc('link_by_invite_code', { target_code: code })
      if (error) {
        const key = (error.message || '').match(/CODE_NOT_FOUND|INVALID_CODE_FORMAT|SAME_ROLE_CANNOT_LINK|CANNOT_LINK_SELF|NOT_AUTHENTICATED/)?.[0]
        setLinkError(LINK_ERRORS[key] || 'No se pudo vincular. Verifica el código.')
        return
      }
      setLinkSuccess(`¡Vinculado con ${data?.partner_name || 'tu apoderado'}! 🎉`)
      setParentCodeInput('')
      setShowLinkForm(false)
      loadLinkedParents()
    } catch (e) {
      setLinkError('Error inesperado. Inténtalo de nuevo.')
    } finally {
      setLinking(false)
    }
  }

  async function unlinkParent(parentId) {
    if (!window.confirm('¿Quitar la vinculación con este apoderado?')) return
    try {
      await supabase.rpc('unlink_partner', { partner: parentId })
      loadLinkedParents()
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="pb-24">
      <TopBar title="Mi perfil" showBack={false} />
      <div className="page-shell mt-4 space-y-4">

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
            {[1, 2, 3, 4, 5, 6, 7, 8].map(g => {
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

        {/* Discreet linking codes (both roles see this) */}
        <LinkingCodes otherRoleLabel={isStudent ? 'apoderado' : 'estudiante'} />

        {isStudent && (
          <div className="card">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="font-black text-gray-700 text-sm">🛟 Recuperar progreso</h3>
                <p className="text-gray-400 text-xs">
                  Si tus números se ven menores de lo que recuerdas, los recalculamos desde tu historial.
                </p>
              </div>
              <button
                type="button"
                onClick={async () => setRecoverResult(await recoverProgress())}
                disabled={recovering}
                className="btn-ghost text-xs py-2 px-3 whitespace-nowrap disabled:opacity-60"
              >
                {recovering ? 'Recuperando…' : 'Recalcular'}
              </button>
            </div>
            {recoverResult && (
              <div className="mt-3 text-xs bg-gray-50 rounded-xl p-2 text-gray-600">
                {recoverResult.error ? (
                  <span className="text-red-500">No pudimos recuperar: {recoverResult.error}</span>
                ) : recoverResult.recovered ? (
                  <span className="text-green-700 font-bold">
                    ✅ Recuperados: {recoverResult.after?.xp} XP · {recoverResult.after?.exercises_total} ejercicios
                  </span>
                ) : (
                  <span>Tu progreso ya estaba completo. Nada que recuperar.</span>
                )}
              </div>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={handleSignOut}
          className="w-full bg-red-50 text-red-500 border border-red-200 rounded-2xl py-3 font-bold text-sm active:scale-95"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}
