import { useEffect, useState } from 'react'
import { useProgress } from '../../contexts/ProgressContext'

// Inline toast that surfaces a Supabase save failure so the kid (or
// parent) is not left thinking everything was saved. We auto-hide once
// persistError clears (the context retries after 3s).
export default function PersistErrorToast() {
  const { persistError } = useProgress()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (persistError) {
      setVisible(true)
    } else {
      // Slight delay so users see the "guardado" state implicitly via
      // disappearance, instead of an abrupt jump.
      const t = setTimeout(() => setVisible(false), 400)
      return () => clearTimeout(t)
    }
  }, [persistError])

  if (!visible) return null
  return (
    <div className="fixed bottom-24 left-4 right-4 z-40 mx-auto max-w-sm">
      <div className={`rounded-2xl shadow-lg border px-4 py-3 text-sm font-bold flex items-center gap-2 ${
        persistError
          ? 'bg-orange-50 border-orange-200 text-orange-700'
          : 'bg-green-50 border-green-200 text-green-700'
      }`}>
        <span>{persistError ? '⚠️' : '✅'}</span>
        <span className="flex-1">
          {persistError
            ? 'Sin conexión — reintentando guardar tu progreso…'
            : 'Progreso guardado.'}
        </span>
      </div>
    </div>
  )
}
