import { getLevelInfo } from '../../lib/curriculum'

export default function XPBar({ xp, compact = false }) {
  const { current, next, progress } = getLevelInfo(xp)

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-lg">{current.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-magic-500 to-primary-500 rounded-full transition-all duration-700"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <span className="text-xs font-bold text-magic-600 whitespace-nowrap">{xp} XP</span>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{current.icon}</span>
          <span className="font-black text-magic-700">{current.title}</span>
        </div>
        <span className="font-bold text-gray-500">{xp} XP</span>
      </div>
      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-magic-500 to-primary-500 rounded-full transition-all duration-700"
          style={{ width: `${progress}%` }}
        />
      </div>
      {next && (
        <div className="flex justify-between mt-1 text-xs text-gray-400">
          <span>{current.title}</span>
          <span>→ {next.icon} {next.title} ({next.minXP} XP)</span>
        </div>
      )}
    </div>
  )
}
