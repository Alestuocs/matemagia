import { useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useProgress } from '../contexts/ProgressContext'
import { getTopicById, CURRICULUM, ACHIEVEMENTS } from '../lib/curriculum'
import TopBar from '../components/layout/TopBar'
import LessonSlide from '../components/lessons/LessonSlide'
import ExerciseEngine from '../components/lessons/ExerciseEngine'
import Celebration from '../components/ui/Celebration'
import Whiteboard from '../components/ui/Whiteboard'

const FULL_EXERCISE_COUNT = 10
const REVIEW_EXERCISE_COUNT = 5
const MAX_LEVEL = 5

const LEVEL_LABELS = {
  1: 'Nivel 1 · Iniciación',
  2: 'Nivel 2 · Práctica',
  3: 'Nivel 3 · Consolida',
  4: 'Nivel 4 · Reto',
  5: 'Nivel 5 · Maestría',
}

export default function LessonPage() {
  const { topicId } = useParams()
  const navigate = useNavigate()
  const { progress, saveAttempt, completeTopic, getTopicLevel, setTopicLevel } = useProgress()

  const topic = getTopicById(topicId)
  const currentGrade = progress.currentGrade || 1
  const isReview = topic && topic.gradeLevel < currentGrade
  const exerciseCount = isReview ? REVIEW_EXERCISE_COUNT : FULL_EXERCISE_COUNT
  const initialLevel = isReview ? 1 : (getTopicLevel?.(topicId) || 1)

  const [phase, setPhase] = useState(isReview ? 'practice' : 'intro')
  const [slideIndex, setSlideIndex] = useState(0)
  const [currentLevel, setCurrentLevel] = useState(initialLevel)
  // `roundSeed` reshuffles the exercise list when the kid taps "Practicar más".
  const [roundSeed, setRoundSeed] = useState(0)
  const [exercises, setExercises] = useState(() =>
    topic ? topic.generateExercises(exerciseCount, initialLevel) : []
  )
  const [exIndex, setExIndex] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [showComplete, setShowComplete] = useState(false)
  const [newAchievements, setNewAchievements] = useState([])
  const [showWhiteboard, setShowWhiteboard] = useState(false)

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
    if (earned?.length > 0) setNewAchievements(prev => [...prev, ...earned])
  }, [topicId, saveAttempt])

  const handleWrong = useCallback(() => {
    saveAttempt(topicId, false, 0)
  }, [topicId, saveAttempt])

  function handleNext() {
    if (exIndex + 1 < exercises.length) {
      setExIndex(i => i + 1)
    } else {
      const accuracy = correctCount / exercises.length
      const stars = accuracy >= 0.9 ? 3 : accuracy >= 0.7 ? 2 : 1
      const { newAchievements: earned } = completeTopic(topicId, stars)
      if (earned?.length > 0) setNewAchievements(prev => [...prev, ...earned])
      setShowComplete(true)
      setPhase('complete')
    }
  }

  function practiceMore() {
    // Bump the difficulty (cap at MAX_LEVEL) and persist it so the next time
    // the student enters this topic they pick up where they left off.
    const accuracy = exercises.length ? correctCount / exercises.length : 0
    const shouldBump = accuracy >= 0.7 && currentLevel < MAX_LEVEL
    const nextLevel = shouldBump ? currentLevel + 1 : currentLevel
    if (shouldBump && !isReview) setTopicLevel(topicId, nextLevel)
    setCurrentLevel(nextLevel)
    setExercises(topic.generateExercises(exerciseCount, nextLevel))
    setExIndex(0)
    setCorrectCount(0)
    setNewAchievements([])
    setShowComplete(false)
    setRoundSeed(s => s + 1)
    setPhase('practice')
  }

  function goNextTopic() {
    const idx = CURRICULUM.findIndex(t => t.id === topicId)
    // Look forward for the next *unlocked* topic so we don't dump the kid
    // in front of a locked one.
    for (let j = idx + 1; j < CURRICULUM.length; j++) {
      const t = CURRICULUM[j]
      if (progress.unlockedTopics?.includes(t.id)) {
        navigate(`/lesson/${t.id}`)
        return
      }
    }
    navigate('/map')
  }

  const accuracy = exercises.length ? correctCount / exercises.length : 0
  const stars = accuracy >= 0.9 ? 3 : accuracy >= 0.7 ? 2 : 1

  return (
    <div className="min-h-screen pb-10">
      <TopBar title={topic.title} showXP />

      <Celebration
        show={showComplete}
        message={`¡Tema completado! ${'⭐'.repeat(stars)}`}
        xp={correctCount * (currentExercise?.xpReward || 10)}
        onDone={() => setShowComplete(false)}
      />

      <div className="page-shell pt-4">
        {isReview ? (
          <div className="mb-3 rounded-2xl bg-blue-50 border border-blue-200 px-3 py-2 text-xs font-bold text-blue-700 text-center">
            🔁 Modo Repaso · {exerciseCount} ejercicios rápidos
          </div>
        ) : (
          <div className="mb-3 rounded-2xl bg-magic-50 border border-magic-200 px-3 py-2 text-xs font-bold text-magic-700 text-center flex items-center justify-center gap-2">
            <span>{LEVEL_LABELS[currentLevel] || `Nivel ${currentLevel}`}</span>
            <span className="text-magic-400">·</span>
            <span className="tracking-widest">
              {Array.from({ length: MAX_LEVEL }).map((_, i) => (
                <span key={i} className={i < currentLevel ? 'text-magic-500' : 'text-magic-200'}>●</span>
              ))}
            </span>
          </div>
        )}

        {phase === 'practice' && (
          <div className="mb-4">
            <div className="flex justify-between text-sm font-bold text-gray-500 mb-1">
              <span>Ejercicio {exIndex + 1} de {exercises.length}</span>
              <span>✅ {correctCount} correctos</span>
            </div>
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-magic-500 to-primary-500 rounded-full transition-all duration-500"
                style={{ width: `${(exIndex / exercises.length) * 100}%` }}
              />
            </div>
          </div>
        )}

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

        {phase === 'lesson' && slides[slideIndex] && (
          <LessonSlide
            slide={slides[slideIndex]}
            onNext={handleSlideNext}
            isLast={slideIndex === slides.length - 1}
          />
        )}

        {phase === 'practice' && currentExercise && (
          <>
            <ExerciseEngine
              key={`${roundSeed}-${exIndex}-${currentExercise.id}`}
              exercise={currentExercise}
              onCorrect={handleCorrect}
              onWrong={handleWrong}
              onNext={handleNext}
            />

            <div className="mt-4">
              <button
                type="button"
                onClick={() => setShowWhiteboard(v => !v)}
                className="text-sm font-bold text-magic-600 hover:text-magic-800 active:scale-95 transition-all"
              >
                {showWhiteboard ? '🙈 Ocultar pizarra' : '📝 Mostrar pizarra para calcular'}
              </button>
              {showWhiteboard && (
                <div className="mt-2">
                  <Whiteboard height={220} />
                  <p className="text-xs text-gray-400 text-center mt-1">
                    Tu pizarra es solo para que pienses. No se envía.
                  </p>
                </div>
              )}
            </div>
          </>
        )}

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

            <button
              type="button"
              onClick={practiceMore}
              className="btn-primary w-full text-lg"
            >
              {(() => {
                const a = exercises.length ? correctCount / exercises.length : 0
                if (a >= 0.7 && currentLevel < MAX_LEVEL && !isReview) {
                  return `🚀 Practicar más · Subir a Nivel ${currentLevel + 1}`
                }
                return '🔁 Practicar más'
              })()}
            </button>

            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={() => navigate('/map')} className="btn-ghost">
                🗺️ Mapa
              </button>
              <button type="button" onClick={goNextTopic} className="btn-secondary">
                Siguiente tema →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
