import { useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useProgress } from '../contexts/ProgressContext'
import { getTopicById, CURRICULUM, ACHIEVEMENTS } from '../lib/curriculum'
import TopBar from '../components/layout/TopBar'
import LessonSlide from '../components/lessons/LessonSlide'
import ExerciseEngine from '../components/lessons/ExerciseEngine'
import Celebration from '../components/ui/Celebration'

const EXERCISE_COUNT = 5

export default function LessonPage() {
  const { topicId } = useParams()
  const navigate = useNavigate()
  const { progress, saveAttempt, completeTopic } = useProgress()

  const topic = getTopicById(topicId)
  const [phase, setPhase] = useState('intro') // intro | lesson | practice | complete
  const [slideIndex, setSlideIndex] = useState(0)
  const [exercises] = useState(() => topic ? topic.generateExercises(EXERCISE_COUNT) : [])
  const [exIndex, setExIndex] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [showComplete, setShowComplete] = useState(false)
  const [newAchievements, setNewAchievements] = useState([])

  if (!topic) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-2">🔍</div>
          <p className="font-bold text-gray-600">Tema no encontrado</p>
          <button onClick={() => navigate('/map')} className="btn-primary mt-4">Volver al mapa</button>
        </div>
      </div>
    )
  }

  const slides = topic.lessonSlides || []
  const currentExercise = exercises[exIndex]

  function handleSlideNext() {
    if (slideIndex < slides.length - 1) {
      setSlideIndex(s => s + 1)
    } else {
      setPhase('practice')
    }
  }

  const handleCorrect = useCallback((xp) => {
    const earned = saveAttempt(topicId, true, xp)
    setCorrectCount(c => c + 1)
    if (earned.length > 0) setNewAchievements(prev => [...prev, ...earned])
  }, [topicId, saveAttempt])

  const handleWrong = useCallback(() => {
    saveAttempt(topicId, false, 0)
  }, [topicId, saveAttempt])

  function handleNext() {
    if (exIndex + 1 < exercises.length) {
      setExIndex(i => i + 1)
    } else {
      // All exercises done
      const stars = correctCount >= 5 ? 3 : correctCount >= 3 ? 2 : 1
      const { newAchievements: earned } = completeTopic(topicId, stars)
      if (earned?.length > 0) setNewAchievements(prev => [...prev, ...earned])
      setShowComplete(true)
      setPhase('complete')
    }
  }

  const stars = correctCount >= 5 ? 3 : correctCount >= 3 ? 2 : 1

  return (
    <div className="min-h-screen pb-10">
      <TopBar title={topic.title} showXP />

      <Celebration
        show={showComplete}
        message={`¡Tema completado! ${'⭐'.repeat(stars)}`}
        xp={correctCount * (currentExercise?.xpReward || 10)}
        onDone={() => setShowComplete(false)}
      />

      <div className="px-4 max-w-lg mx-auto pt-4">
        {/* Progress bar */}
        {phase === 'practice' && (
          <div className="mb-4">
            <div className="flex justify-between text-sm font-bold text-gray-500 mb-1">
              <span>Ejercicio {exIndex + 1} de {exercises.length}</span>
              <span>✅ {correctCount} correctos</span>
            </div>
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-magic-500 to-primary-500 rounded-full transition-all duration-500"
                style={{ width: `${((exIndex) / exercises.length) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Intro */}
        {phase === 'intro' && (
          <div className="animate-slide-up space-y-4">
            <div className="card bg-gradient-to-br from-magic-50 to-yellow-50 border-magic-200 text-center py-8">
              <div className="text-6xl mb-3">{topic.icon}</div>
              <h2 className="text-2xl font-black text-magic-700 mb-2">{topic.title}</h2>
              <p className="text-gray-600 font-semibold">{topic.description}</p>
            </div>
            {topic.tips && topic.tips.length > 0 && (
              <div className="card bg-yellow-50 border-yellow-200">
                <h3 className="font-black text-yellow-700 mb-2">💡 Consejos útiles</h3>
                <ul className="space-y-1">
                  {topic.tips.map((tip, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm font-semibold text-gray-600">
                      <span className="text-yellow-400 mt-0.5">•</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <button
              onClick={() => slides.length > 0 ? setPhase('lesson') : setPhase('practice')}
              className="btn-primary w-full text-lg"
            >
              {slides.length > 0 ? '¡Aprender! 📖' : '¡Empezar práctica! 🚀'}
            </button>
          </div>
        )}

        {/* Lesson slides */}
        {phase === 'lesson' && slides[slideIndex] && (
          <LessonSlide
            slide={slides[slideIndex]}
            onNext={handleSlideNext}
            isLast={slideIndex === slides.length - 1}
          />
        )}

        {/* Practice */}
        {phase === 'practice' && currentExercise && (
          <ExerciseEngine
            key={`${exIndex}-${currentExercise.id}`}
            exercise={currentExercise}
            onCorrect={handleCorrect}
            onWrong={handleWrong}
            onNext={handleNext}
          />
        )}

        {/* Complete */}
        {phase === 'complete' && (
          <div className="animate-pop space-y-4 text-center">
            <div className="card border-2 border-yellow-300 bg-yellow-50 py-8">
              <div className="text-6xl mb-3">🎉</div>
              <h2 className="text-2xl font-black text-yellow-700">¡Tema completado!</h2>
              <div className="flex justify-center gap-1 my-3">
                {[1, 2, 3].map(s => (
                  <span key={s} className={`text-4xl transition-all ${s <= stars ? 'text-yellow-400 animate-sparkle' : 'text-gray-200'}`}>★</span>
                ))}
              </div>
              <p className="text-gray-600 font-semibold">{correctCount}/{exercises.length} ejercicios correctos</p>
            </div>

            {newAchievements.length > 0 && (
              <div className="card border-2 border-magic-200 bg-magic-50">
                <h3 className="font-black text-magic-700 mb-2">🏅 ¡Nuevos logros!</h3>
                {newAchievements.map(id => {
                  const a = ACHIEVEMENTS?.find(x => x.id === id)
                  return a ? (
                    <div key={id} className="flex items-center gap-2 bg-white rounded-xl p-2">
                      <span className="text-2xl">{a.icon}</span>
                      <span className="font-bold text-sm">{a.title}</span>
                    </div>
                  ) : null
                })}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => navigate('/map')} className="btn-ghost">
                🗺️ Mapa
              </button>
              <button
                onClick={() => {
                  const idx = CURRICULUM.findIndex(t => t.id === topicId)
                  const next = CURRICULUM[idx + 1]
                  if (next && progress.unlockedTopics.includes(next.id)) {
                    navigate(`/lesson/${next.id}`)
                  } else {
                    navigate('/')
                  }
                }}
                className="btn-primary"
              >
                Siguiente →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
