import { useEffect, useRef } from 'react'

export default function Celebration({ show, message = '¡Excelente!', xp = 0, onDone }) {
  const ran = useRef(false)

  useEffect(() => {
    if (!show || ran.current) return
    ran.current = true

    // Dynamically import canvas-confetti
    import('canvas-confetti').then(({ default: confetti }) => {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#8b5cf6', '#f59e0b', '#10b981', '#f43f5e', '#3b82f6'],
      })
      setTimeout(() => {
        confetti({
          particleCount: 60,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#8b5cf6', '#f59e0b'],
        })
        confetti({
          particleCount: 60,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#10b981', '#f43f5e'],
        })
      }, 300)
    }).catch(() => {})

    const timer = setTimeout(() => {
      ran.current = false
      onDone?.()
    }, 3000)
    return () => clearTimeout(timer)
  }, [show])

  if (!show) return null

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
      <div className="animate-pop bg-white rounded-3xl shadow-2xl p-8 text-center border-4 border-magic-500 mx-4">
        <div className="text-6xl mb-3">🎉</div>
        <h2 className="text-2xl font-black text-magic-600 mb-1">{message}</h2>
        {xp > 0 && (
          <div className="text-xl font-bold text-primary-600 animate-bounce">
            +{xp} XP ⭐
          </div>
        )}
      </div>
    </div>
  )
}
