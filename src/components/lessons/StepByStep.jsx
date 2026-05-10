import { useState } from 'react'

export default function StepByStep({ explanation, onDone }) {
  const steps = explanation.split('\n').filter(Boolean)
  const [currentStep, setCurrentStep] = useState(0)
  const [done, setDone] = useState(false)

  function next() {
    if (currentStep < steps.length - 1) {
      setCurrentStep(s => s + 1)
    } else {
      setDone(true)
    }
  }

  return (
    <div className="animate-slide-up card border-2 border-blue-200 bg-blue-50">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl">📖</span>
        <h3 className="font-black text-blue-700">Solución paso a paso</h3>
      </div>

      <div className="space-y-2 mb-4">
        {steps.slice(0, currentStep + 1).map((step, i) => (
          <div
            key={i}
            className={`flex gap-2 items-start p-3 rounded-xl transition-all ${
              i === currentStep && !done ? 'bg-white border-2 border-blue-300 animate-pop' : 'bg-white/60'
            }`}
          >
            <span className="w-6 h-6 bg-blue-500 text-white rounded-full text-xs flex items-center justify-center font-bold flex-shrink-0 mt-0.5">
              {i + 1}
            </span>
            <span className="font-semibold text-gray-700">{step}</span>
          </div>
        ))}
      </div>

      {!done ? (
        <button onClick={next} className="btn-primary w-full">
          {currentStep < steps.length - 1 ? 'Siguiente paso →' : 'Ver resumen'}
        </button>
      ) : (
        <button onClick={onDone} className="btn-secondary w-full">
          ¡Entendí, a practicar! 💪
        </button>
      )}
    </div>
  )
}
