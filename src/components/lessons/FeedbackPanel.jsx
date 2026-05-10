import { useState } from 'react'
import StepByStep from './StepByStep'

const ENCOURAGING = [
  '¡Casi lo tienes! 💪',
  '¡No te rindas, tú puedes! 🌟',
  '¡Inténtalo de nuevo! 🔄',
  '¡Estás aprendiendo mucho! 😊',
  '¡Los errores nos enseñan! 📚',
]

export default function FeedbackPanel({ exercise, wrongCount, onNext, onShowSteps }) {
  const msg = ENCOURAGING[wrongCount % ENCOURAGING.length]
  const [showSteps, setShowSteps] = useState(false)

  return (
    <div className="animate-slide-up space-y-3">
      <div className="card border-2 border-red-200 bg-red-50">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">💡</span>
          <p className="font-black text-red-600">{msg}</p>
        </div>
        <p className="text-gray-600 font-semibold">
          La respuesta correcta es: <span className="text-green-600 font-black">{String(exercise.answer)}</span>
        </p>
        {exercise.hint && (
          <div className="mt-2 bg-yellow-50 rounded-xl p-3 border border-yellow-200">
            <p className="text-sm font-semibold text-yellow-700">
              💡 Pista: {exercise.hint}
            </p>
          </div>
        )}
      </div>

      {showSteps ? (
        <StepByStep explanation={exercise.explanation} onDone={onNext} />
      ) : (
        <div className="space-y-2">
          <button
            onClick={() => setShowSteps(true)}
            className="btn-ghost w-full"
          >
            📖 Ver cómo se resuelve paso a paso
          </button>
          <button onClick={onNext} className="btn-primary w-full">
            Siguiente ejercicio ➡️
          </button>
        </div>
      )}
    </div>
  )
}
