import { useProgress } from '../contexts/ProgressContext'
import { ACHIEVEMENTS } from '../lib/curriculum'
import TopBar from '../components/layout/TopBar'

export default function AchievementsPage() {
  const { progress } = useProgress()
  const earned = progress.achievements || []
  const earnedCount = earned.length

  return (
    <div className="pb-24">
      <TopBar title="Logros 🏆" showBack={false} showXP />
      <div className="px-4 max-w-lg mx-auto mt-4">
        <div className="card mb-4 text-center bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
          <div className="text-4xl mb-1">🏅</div>
          <div className="text-3xl font-black text-yellow-600">{earnedCount}/{ACHIEVEMENTS.length}</div>
          <div className="text-gray-500 font-semibold text-sm">logros obtenidos</div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {ACHIEVEMENTS.map(a => {
            const isEarned = earned.includes(a.id)
            return (
              <div
                key={a.id}
                className={`card flex flex-col items-center text-center gap-2 transition-all ${
                  isEarned
                    ? 'border-2 border-yellow-300 bg-yellow-50 shadow-lg shadow-yellow-100'
                    : 'opacity-60 grayscale'
                }`}
              >
                <span className="text-4xl">{a.icon}</span>
                <div>
                  <div className={`font-black text-sm ${isEarned ? 'text-gray-800' : 'text-gray-400'}`}>
                    {a.title}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">{a.description}</div>
                </div>
                {isEarned && (
                  <div className="w-full bg-green-100 text-green-600 text-xs font-bold px-2 py-1 rounded-xl">
                    ✓ Obtenido
                  </div>
                )}
                {!isEarned && (
                  <div className="w-full bg-gray-100 text-gray-400 text-xs font-bold px-2 py-1 rounded-xl">
                    🔒 Bloqueado
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
