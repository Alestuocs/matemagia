import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useProgress } from '../../contexts/ProgressContext'
import { sanitize } from '../../lib/utils'

const ERRORS = {
  CODE_NOT_FOUND: 'No encontramos ese código.',
  INVALID_CODE_FORMAT: 'El código debe tener el formato XXX-XXX.',
  SAME_ROLE_CANNOT_LINK: 'Ese código es de alguien del mismo rol que tú.',
  CANNOT_LINK_SELF: 'No puedes vincularte contigo mismo/a.',
  NOT_AUTHENTICATED: 'Tu sesión expiró. Vuelve a iniciar sesión.',
}

// Discreet linking-codes panel. Shows the user their own code (small,
// copyable) plus a collapsed input to link with someone else's code.
// Works for both roles (parent / student). Used in Profile (student) and
// the Parent Dashboard.
export default function LinkingCodes({ otherRoleLabel = 'apoderado' }) {
  const { progress } = useProgress()
  const myCode = progress.inviteCode || ''
  const [copied, setCopied] = useState(false)
  const [show, setShow] = useState(false)
  const [code, setCode] = useState('')
  const [linking, setLinking] = useState(false)
  const [err, setErr] = useState('')
  const [ok, setOk] = useState('')
  const [linkedCount, setLinkedCount] = useState(null)

  useEffect(() => {
    supabase.rpc('my_linked_partners').then(({ data }) => {
      setLinkedCount((data || []).length)
    }).catch(() => {})
  }, [ok])

  async function copyMy() {
    if (!myCode) return
    try {
      await navigator.clipboard.writeText(myCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch (_) {}
  }

  async function submit() {
    setErr(''); setOk('')
    const c = sanitize.code(code)
    if (c.length < 6) { setErr('Formato XXX-XXX'); return }
    setLinking(true)
    try {
      const { data, error } = await supabase.rpc('link_by_invite_code', { target_code: c })
      if (error) {
        const key = (error.message || '').match(/CODE_NOT_FOUND|INVALID_CODE_FORMAT|SAME_ROLE_CANNOT_LINK|CANNOT_LINK_SELF|NOT_AUTHENTICATED/)?.[0]
        setErr(ERRORS[key] || 'No se pudo vincular.')
        return
      }
      setOk(`¡Vinculado con ${data?.partner_name || 'éxito'}! 🎉`)
      setCode('')
      setShow(false)
    } catch (_) {
      setErr('Error inesperado.')
    } finally {
      setLinking(false)
    }
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-3 space-y-2">
      <div className="flex items-center justify-between text-xs font-bold">
        <span className="text-gray-500">🔑 Mi código</span>
        <div className="flex items-center gap-2">
          <span className="font-mono text-magic-700 tracking-widest text-base">
            {myCode || '— · —'}
          </span>
          <button
            type="button"
            onClick={copyMy}
            disabled={!myCode}
            className="text-[10px] bg-magic-100 hover:bg-magic-200 text-magic-700 rounded-md px-2 py-1 disabled:opacity-40"
          >
            {copied ? '✓' : '📋'}
          </button>
        </div>
      </div>

      {linkedCount != null && (
        <p className="text-[10px] text-gray-400">
          {linkedCount > 0
            ? `Vinculado con ${linkedCount} ${linkedCount === 1 ? 'persona' : 'personas'}.`
            : `Sin vinculaciones. Comparte tu código o agrega el de tu ${otherRoleLabel}.`}
        </p>
      )}

      {ok && <p className="text-[11px] text-green-600 font-bold">{ok}</p>}

      {!show ? (
        <button
          type="button"
          onClick={() => { setShow(true); setErr(''); setOk('') }}
          className="text-[11px] font-bold text-gray-500 hover:text-magic-600"
        >
          + Agregar a un {otherRoleLabel} por código
        </button>
      ) : (
        <div className="space-y-1.5">
          <input
            value={code}
            onChange={e => setCode(sanitize.code(e.target.value))}
            placeholder={`Código de tu ${otherRoleLabel}`}
            maxLength={7}
            className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm font-mono tracking-widest uppercase text-center focus:outline-none focus:border-magic-400"
          />
          {err && <p className="text-[11px] text-red-500 font-semibold">{err}</p>}
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={submit}
              disabled={linking}
              className="flex-1 bg-magic-500 text-white rounded-lg py-1.5 text-xs font-bold disabled:opacity-50"
            >
              {linking ? '…' : 'Vincular'}
            </button>
            <button
              type="button"
              onClick={() => { setShow(false); setErr('') }}
              className="px-3 bg-gray-100 text-gray-600 rounded-lg text-xs font-bold"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
