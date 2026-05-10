export default function StreakBadge({ streak, compact = false }) {
  const isHot = streak >= 3

  if (compact) {
    return (
      <div className={`flex items-center gap-1 px-2 py-1 rounded-full font-bold text-sm ${isHot ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-500'}`}>
        <span className={isHot ? 'animate-sparkle' : ''}>🔥</span>
        <span>{streak}</span>
      </div>
    )
  }

  return (
    <div className={`card flex items-center gap-3 ${isHot ? 'border-orange-300 bg-orange-50' : ''}`}>
      <span className={`text-4xl ${isHot ? 'animate-sparkle' : ''}`}>🔥</span>
      <div>
        <div className="font-black text-xl text-orange-500">{streak} {streak === 1 ? 'día' : 'días'}</div>
        <div className="text-sm text-gray-500">
          {streak === 0 ? '¡Empieza hoy!' : streak < 3 ? '¡Vas muy bien!' : streak < 7 ? '¡Racha de fuego!' : '¡Eres increíble! 🌟'}
        </div>
      </div>
    </div>
  )
}
