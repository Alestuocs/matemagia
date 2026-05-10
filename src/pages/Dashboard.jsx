import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useProgress } from '../contexts/ProgressContext'
import { CURRICULUM, getLevelInfo, ACHIEVEMENTS } from '../lib/curriculum'
import XPBar from '../components/ui/XPBar'
import StreakBadge from '../components/ui/StreakBadge'

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return '¡Buenos días'
  if (h < 18) return '¡Buenas tardes'
  return '¡Buenas noches'
}

function getMotivation(progress) {
  if (progress.streak >= 7) return '¡Eres una leyenda! 🏆 Llevas una semana estudiando.'
  if (progress.streak >= 3) return '¡Increíble racha! 🔥 Sigue así.'
  if (progress.dailyGoalDone >= progress.dailyGoal) return '¡Meta del día cumplida! 🎯 ¡Eres genial!'
  if (progress.exercisesToday > 0) return '¡Vas muy bien hoy! 💪 Sigue practicando.'
  return '¡Hoy es un gran día para aprender! 🌟'
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { progress } = useProgress()

  const name = progress.studentName || user?.user_metadata?.full_name?.split(' ')[0] || 'Campeón'
  const avatar = user?.user_metadata?.avatar_url

  const nextTopic = CURRICULUM.find(t =>
    !progress.completedTopics.includes(t.id) &&
    progress.unlockedTopics.includes(t.id)
  )

  const recentAchievements = (progress.achievements || [])
    .slice(-3)
    .map(id => ACHIEVEMENTS.find(a => a.id === id))
    .filter(Boolean)

  const goalPct = Math.min(100, Math.round((progress.dailyGoalDone / (progress.dailyGoal || 5)) * 100))
  const correctRate = progress.exercisesTotal > 0
    ? Math.round((progress.correctTotal / progress.exercisesTotal) * 100)
    : 0

  const { current } = getLevelInfo(progress.xp)

  return (
    <div className="pb-24 pt-2 px-4 max-w-lg mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between py-3">
        <div>
          <h1 className="text-2xl font-black text-gray-800">
            {getGreeting()}, {name}! 👋
          </h1>
          <p className="text-gray-500 font-semibold text-sm">{getMotivation(progress)}</p>
        </div>
        {avatar ? (
          <img src={avatar} alt={name} className="w-12 h-12 rounded-full border-2 border-magic-300" />
        ) : (
          <div className="w-12 h-12 rounded-full bg-magic-100 flex items-center justify-center text-2xl border-2 border-magic-300">
            {name[0]?.toUpperCase() || '🧒'}
          </div>
        )}
      </div>

      {/* Level & XP */}
      <XPBar xp={progress.xp} />

      {/* Streak & Daily goal */}
      <div className="grid grid-cols-2 gap-3">
        <StreakBadge streak={progress.streak} />
        <div className="card flex flex-col items-center justify-center text-center">
          <div className="relative w-16 h-16 mb-1">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e5e7eb" strokeWidth="3" />
              <circle
                cx="18" cy="18" r="15.9" fill="none"
                stroke="#8b5cf6" strokeWidth="3"
                strokeDasharray={`${goalPct} ${100 - goalPct}`}
                strokeLinecap="round"
                className="transition-all duration-700"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-sm font-black text-magic-600">
              {goalPct}%
            </div>
          </div>
          <div className="text-xs font-bold text-gray-500">Meta diaria</div>
          <div className="text-xs text-gray-400">{progress.dailyGoalDone}/{progress.dailyGoal}</div>
        </div>
      </div>

      {/* Continue learning */}
      {nextTopic ? (
        <button
          onClick={() => navigate(`/lesson/${nextTopic.id}`)}
          className="w-full bg-gradient-to-r from-magic-500 to-purple-600 text-white rounded-3xl p-5 text-left shadow-lg active:scale-95 transition-transform animate-pulse-glow"
        >
          <div className="text-xs font-bold text-purple-200 mb-1">CONTINUAR APRENDIENDO</div>
          <div className="flex items-center gap-3">
            <span className="text-3xl">{nextTopic.icon}</span>
            <div>
              <div className="font-black text-lg">{nextTopic.title}</div>
              <div className="text-purple-200 text-sm font-semibold">{nextTopic.description}</div>
            </div>
            <span className="ml-auto text-2xl">→</span>
          </div>
        </button>
      ) : (
        <div className="card text-center border-2 border-green-200 bg-green-50">
          <div className="text-4xl mb-2">🏆</div>
          <p className="font-black text-green-700">¡Completaste todo el programa!</p>
        </div>
      )}

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="card text-center">
          <div className="text-2xl font-black text-magic-600">{progress.exercisesToday}</div>
          <div className="text-xs text-gray-400 font-semibold">Hoy</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-black text-green-500">{correctRate}%</div>
          <div className="text-xs text-gray-400 font-semibold">Aciertos</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-black text-primary-500">{progress.completedTopics.length}</div>
          <div className="text-xs text-gray-400 font-semibold">Temas</div>
        </div>
      </div>

      {/* Recent achievements */}
      {recentAchievements.length > 0 && (
        <div className="card">
          <h3 className="font-black text-gray-700 mb-3">🏅 Últimos logros</h3>
          <div className="space-y-2">
            {recentAchievements.map(a => (
              <div key={a.id} className="flex items-center gap-3 bg-yellow-50 rounded-xl p-2">
                <span className="text-2xl">{a.icon}</span>
                <div>
                  <div className="font-black text-sm text-gray-700">{a.title}</div>
                  <div className="text-xs text-gray-400">{a.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => navigate('/map')} className="btn-ghost flex items-center justify-center gap-2">
          🗺️ Ver mapa
        </button>
        <button onClick={() => navigate('/games')} className="btn-ghost flex items-center justify-center gap-2">
          🎮 Jugar
        </button>
      </div>
    </div>
  )
}
