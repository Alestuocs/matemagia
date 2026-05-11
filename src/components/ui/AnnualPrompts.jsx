import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useProgress } from '../../contexts/ProgressContext'
import { sanitize } from '../../lib/utils'
import { gradeLabel } from '../../lib/curriculum'

const DEC_PROMPT_KEY = 'mm_dec_prompt_dismissed'
const NO_PARENT_KEY = 'mm_no_parent_dismissed'

function shouldShowDecemberPrompt(progress) {
  const now = new Date()
  // Trigger window: Dec 1 → Feb 28 of next year (Chilean school year change)
  const month = now.getMonth() // 0-11
  const inWindow = month === 11 || month === 0 || month === 1
  if (!inWindow) return false

  const yearKey = month === 11 ? now.getFullYear() : now.getFullYear() - 1
  const dismissed = localStorage.getItem(DEC_PROMPT_KEY + ':' + yearKey)
  if (dismissed) return false

  // Don't prompt brand-new accounts (assessment-done very recently)
  return progress.assessmentDone && progress.currentGrade >= 1
}

function dismissDecember() {
  const now = new Date()
  const yearKey = now.getMonth() === 11 ? now.getFullYear() : now.getFullYear() - 1
  localStorage.setItem(DEC_PROMPT_KEY + ':' + yearKey, '1')
}

export function AnnualGradePrompt({ onClose }) {
  const { progress, persistProgress } = useProgress()
  const [selected, setSelected] = useState(progress.currentGrade)
  const next = Math.min(8, (progress.currentGrade || 1) + 1)

  function handleConfirm() {
    persistProgress({ ...progress, currentGrade: selected })
    dismissDecember()
    onClose()
  }

  function handleStay() {
    dismissDecember()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
        <div className="text-center">
          <div className="text-5xl mb-2">🎉</div>
          <h2 className="text-xl font-black text-magic-700">¡Año nuevo escolar!</h2>
          <p className="text-gray-500 text-sm mt-1">
            ¿Pasaste a un curso nuevo? Actualiza tu nivel para ver el contenido correcto.
          </p>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(g => (
            <button key={g} onClick={() => setSelected(g)}
              className={`py-3 rounded-xl font-black text-sm transition-all ${
                selected === g ? 'bg-magic-500 text-white' : 'bg-gray-100 text-gray-600'
              } ${g === next ? 'ring-2 ring-yellow-400' : ''}`}>
              {gradeLabel(g)}
            </button>
          ))}
        </div>

        <div className="flex gap-2 pt-2">
          <button onClick={handleStay} className="flex-1 bg-gray-100 text-gray-700 rounded-xl py-3 font-bold text-sm">
            Sigo en {gradeLabel(progress.currentGrade)}
          </button>
          <button onClick={handleConfirm} className="flex-1 bg-magic-500 text-white rounded-xl py-3 font-black text-sm">
            Guardar
          </button>
        </div>
      </div>
    </div>
  )
}

export function NoParentPrompt({ onClose }) {
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit() {
    const c = sanitize.code(code)
    if (c.length < 6) { setError('Ingresa el código completo (XXX-XXX).'); return }
    setBusy(true); setError('')
    try {
      const { error: rpcErr } = await supabase.rpc('link_by_invite_code', { target_code: c })
      if (rpcErr) {
        const key = (rpcErr.message || '').match(/CODE_NOT_FOUND|INVALID_CODE_FORMAT|SAME_ROLE_CANNOT_LINK|CANNOT_LINK_SELF/)?.[0]
        const msgs = {
          CODE_NOT_FOUND: 'No encontramos ese código.',
          INVALID_CODE_FORMAT: 'Formato XXX-XXX.',
          SAME_ROLE_CANNOT_LINK: 'Ese código es de un estudiante, no de un apoderado.',
          CANNOT_LINK_SELF: 'No puedes vincularte contigo mismo/a.',
        }
        setError(msgs[key] || 'No se pudo vincular.')
        return
      }
      dismissNoParent()
      onClose()
    } catch (e) {
      setError('Error inesperado. Inténtalo de nuevo.')
    } finally {
      setBusy(false)
    }
  }

  function dismiss() {
    dismissNoParent()
    onClose()
  }

  function skipForever() {
    localStorage.setItem(NO_PARENT_KEY, 'forever')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
        <div className="text-center">
          <div className="text-5xl mb-2">👨‍👩‍👧</div>
          <h2 className="text-xl font-black text-magic-700">¿Tienes un apoderado?</h2>
          <p className="text-gray-500 text-sm mt-1">
            Si tu papá, mamá o cuidador/a usa MateMagia, pídeles su <span className="font-bold">código</span> para que vean tu progreso.
          </p>
        </div>

        <input
          value={code}
          onChange={e => setCode(sanitize.code(e.target.value))}
          placeholder="Código del apoderado (XXX-XXX)"
          maxLength={7}
          className="w-full border-2 border-magic-200 rounded-xl px-4 py-3 text-base font-mono tracking-widest uppercase text-center focus:outline-none focus:border-magic-500"
        />

        {error && <p className="text-red-500 text-sm font-semibold text-center">{error}</p>}

        <button onClick={handleSubmit} disabled={busy}
          className="w-full bg-magic-500 text-white rounded-xl py-3 font-black text-sm disabled:opacity-50">
          {busy ? 'Verificando...' : 'Vincular'}
        </button>

        <div className="flex gap-2 text-xs">
          <button onClick={dismiss} className="flex-1 text-gray-500 font-bold py-2">
            Ahora no
          </button>
          <button onClick={skipForever} className="flex-1 text-gray-400 font-bold py-2">
            No tengo apoderado
          </button>
        </div>
      </div>
    </div>
  )
}

function dismissNoParent() {
  const today = new Date().toISOString().slice(0, 10)
  localStorage.setItem(NO_PARENT_KEY, today)
}

function shouldShowNoParentPrompt(progress, linkedParentCount) {
  if (progress.role === 'parent') return false
  if (!progress.assessmentDone) return false
  if (linkedParentCount > 0) return false
  const skip = localStorage.getItem(NO_PARENT_KEY)
  if (skip === 'forever') return false
  if (skip) {
    // skipped today already?
    const lastSkip = new Date(skip + 'T00:00:00')
    const daysSince = (Date.now() - lastSkip.getTime()) / 86400000
    if (daysSince < 7) return false // re-prompt weekly
  }
  return true
}

export default function AnnualPrompts() {
  const { progress } = useProgress()
  const [showDec, setShowDec] = useState(false)
  const [showNoParent, setShowNoParent] = useState(false)

  useEffect(() => {
    if (progress.role === 'parent') return
    if (!progress.assessmentDone) return

    if (shouldShowDecemberPrompt(progress)) {
      setShowDec(true)
      return
    }

    // Check linked parents
    supabase.rpc('my_linked_partners').then(({ data }) => {
      const parents = (data || []).filter(p => p.partner_role === 'parent')
      if (shouldShowNoParentPrompt(progress, parents.length)) {
        setShowNoParent(true)
      }
    }).catch(() => {})
  }, [progress.assessmentDone, progress.role])

  if (showDec) return <AnnualGradePrompt onClose={() => setShowDec(false)} />
  if (showNoParent) return <NoParentPrompt onClose={() => setShowNoParent(false)} />
  return null
}
