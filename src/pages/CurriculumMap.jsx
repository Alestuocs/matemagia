import { useNavigate } from 'react-router-dom'
import { useProgress } from '../contexts/ProgressContext'
import { CURRICULUM, GRADE_LABELS } from '../lib/curriculum'
import TopBar from '../components/layout/TopBar'

const GRADE_COLORS = {
  1: 'from-green-400 to-emerald-500',
  2: 'from-blue-400 to-cyan-500',
  3: 'from-purple-400 to-violet-500',
  4: 'from-orange-400 to-amber-500',
  5: 'from-pink-400 to-rose-500',
  6: 'from-red-400 to-orange-500',
  7: 'from-indigo-400 to-blue-600',
  8: 'from-gray-500 to-slate-600',
}

const GRADE_BG = {
  1: 'bg-green-50 border-green-200',
  2: 'bg-blue-50 border-blue-200',
  3: 'bg-purple-50 border-purple-200',
  4: 'bg-orange-50 border-orange-200',
  5: 'bg-pink-50 border-pink-200',
  6: 'bg-red-50 border-red-200',
  7: 'bg-indigo-50 border-indigo-200',
  8: 'bg-slate-50 border-slate-200',
}

export default function CurriculumMap() {
  const navigate = useNavigate()
  const { progress } = useProgress()

  const currentGrade = progress.currentGrade || 1
  const grades = [1, 2, 3, 4, 5, 6, 7, 8]

  return (
    <div className="pb-24">
      <TopBar title="Mapa de aprendizaje 🗺️" showBack={false} showXP />

      <div className="page-shell space-y-6 mt-4">
        {grades.map(grade => {
          const topics = CURRICULUM.filter(t => t.gradeLevel === grade)
          if (topics.length === 0) return null

          const completed = topics.filter(t => progress.completedTopics.includes(t.id)).length
          const pct = Math.round((completed / topics.length) * 100)
          const isCurrentGrade = grade === currentGrade
          const isPreviousGrade = grade < currentGrade
          const isFutureGrade = grade > currentGrade

          // Future grades: show as locked unless has unlocked topics
          const hasAnyUnlocked = topics.some(t => progress.unlockedTopics.includes(t.id))
          if (isFutureGrade && !hasAnyUnlocked) {
            return (
              <div key={grade} className="rounded-3xl border-2 p-4 bg-gray-50 border-gray-200 opacity-60">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-black text-lg text-gray-400">{GRADE_LABELS[grade]}</h2>
                      <span className="text-xs font-bold bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full">
                        🔒 Bloqueado
                      </span>
                    </div>
                    <div className="text-sm text-gray-400 font-semibold">{topics.length} temas</div>
                  </div>
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${GRADE_COLORS[grade] || 'from-gray-400 to-gray-500'} flex items-center justify-center font-black text-white text-xl opacity-40`}>
                    {grade}
                  </div>
                </div>
              </div>
            )
          }

          return (
            <div key={grade} className={`rounded-3xl border-2 p-4 ${GRADE_BG[grade] || 'bg-gray-50 border-gray-200'}`}>
              {/* Grade header */}
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-black text-lg text-gray-800">{GRADE_LABELS[grade]}</h2>
                    {isPreviousGrade && (
                      <span className="text-xs font-bold bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">
                        Repaso
                      </span>
                    )}
                    {isCurrentGrade && (
                      <span className="text-xs font-bold bg-magic-100 text-magic-700 px-2 py-0.5 rounded-full">
                        Tu Grado
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500 font-semibold">{completed}/{topics.length} temas</div>
                </div>
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${GRADE_COLORS[grade] || 'from-gray-400 to-gray-500'} flex items-center justify-center font-black text-white text-xl`}>
                  {grade}
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-2 bg-white rounded-full overflow-hidden mb-4 border border-gray-200">
                <div
                  className={`h-full bg-gradient-to-r ${isPreviousGrade ? 'from-blue-400 to-cyan-400' : (GRADE_COLORS[grade] || 'from-gray-400 to-gray-500')} rounded-full transition-all duration-700`}
                  style={{ width: `${pct}%` }}
                />
              </div>

              {/* Topics */}
              <div className="space-y-2">
                {topics.map((topic) => {
                  const isCompleted = progress.completedTopics.includes(topic.id)
                  const isUnlocked = progress.unlockedTopics.includes(topic.id)
                  const stars = progress.topicStars[topic.id] || 0
                  const isCurrent = isUnlocked && !isCompleted
                  const isReview = isPreviousGrade

                  return (
                    <button
                      key={topic.id}
                      onClick={() => isUnlocked && navigate(`/lesson/${topic.id}`)}
                      disabled={!isUnlocked}
                      className={`w-full flex items-center gap-3 p-3 rounded-2xl border-2 text-left transition-all active:scale-95 ${
                        isCompleted
                          ? 'bg-green-100 border-green-300'
                          : isCurrent && isReview
                          ? 'bg-blue-50 border-blue-300 hover:bg-blue-100'
                          : isCurrent
                          ? 'bg-white border-magic-400 animate-pulse-glow'
                          : 'bg-white/50 border-gray-200 opacity-60'
                      }`}
                    >
                      <span className="text-2xl">{topic.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className={`font-black truncate ${
                          isCompleted
                            ? 'text-green-700'
                            : isCurrent && isReview
                            ? 'text-blue-600'
                            : isCurrent
                            ? 'text-magic-700'
                            : 'text-gray-400'
                        }`}>
                          {topic.title}
                        </div>
                        <div className="text-xs text-gray-400 font-semibold truncate">{topic.description}</div>
                      </div>
                      <div className="flex-shrink-0">
                        {isCompleted ? (
                          <div className="flex gap-0.5">
                            {[1, 2, 3].map(s => (
                              <span key={s} className={`text-sm ${s <= stars ? 'text-yellow-400' : 'text-gray-200'}`}>★</span>
                            ))}
                          </div>
                        ) : isCurrent && isReview ? (
                          <span className="text-blue-400 font-black text-sm">▶</span>
                        ) : isCurrent ? (
                          <span className="text-magic-500 font-black text-sm">▶</span>
                        ) : (
                          <span className="text-gray-300 text-lg">🔒</span>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>

              {isPreviousGrade && (
                <p className="text-xs text-blue-500 font-semibold text-center mt-3">
                  Repaso opcional — refuerza tus bases
                </p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
