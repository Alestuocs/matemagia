import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { CURRICULUM, gradeLabel, GRADE_LABELS } from '../lib/curriculum'
import { useProgress } from '../contexts/ProgressContext'
import TopBar from '../components/layout/TopBar'
import ExerciseEngine from '../components/lessons/ExerciseEngine'
import Whiteboard from '../components/ui/Whiteboard'
import Celebration from '../components/ui/Celebration'

const EXERCISE_COUNT = 10

export default function PracticeMode() {
  const navigate = useNavigate()
  const { progress, saveAttempt, getTopicLevel, setTopicLevel } = useProgress()
  const grade = progress.currentGrade || 1

  const [chosenTopicId, setChosenTopicId] = useState(null)
  const chosenTopic = chosenTopicId ? CURRICULUM.find(t => t.id === chosenTopicId) : null

  // Topics for picker: only the student's grade and the previous grade
  // (the lower ones become "repaso", their own grade is "currículo").
  const myGradeTopics = CURRICULUM.filter(t => t.gradeLevel === grade)
  const reviewTopics = CURRICULUM.filter(t => t.gradeLevel < grade)

  if (!chosenTopic) {
    return (
      <div className="pb-24">
        <TopBar title="Practicar" showBack={false} showXP />
        <div className="page-shell mt-4 space-y-5">
          <div className="card bg-gradient-to-br from-magic-50 to-purple-50 border-magic-200 text-center">
            <div className="text-4xl mb-2">🎯</div>
            <h2 className="text-lg font-black text-magic-700">Elige qué practicar</h2>
            <p className="text-sm text-gray-500 mt-1">
              Practicas con ejercicios de <span className="font-bold">{GRADE_LABELS[grade]}</span> o de repaso.
            </p>
          </div>

          <section>
            <h3 className="font-black text-gray-700 mb-2 px-1">
              📚 Tu grado · {GRADE_LABELS[grade]}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {myGradeTopics.map(t => (
                <TopicCard
                  key={t.id}
                  topic={t}
                  level={getTopicLevel?.(t.id) || 1}
                  badge="Currículo"
                  badgeClass="bg-magic-100 text-magic-700"
                  onClick={() => setChosenTopicId(t.id)}
                />
              ))}
              {myGradeTopics.length === 0 && (
                <div className="col-span-2 text-center text-sm text-gray-400 py-4">
                  Aún no tienes temas del grado {GRADE_LABELS[grade]}.
                </div>
              )}
            </div>
          </section>

          {reviewTopics.length > 0 && (
            <section>
              <h3 className="font-black text-gray-700 mb-2 px-1">🔁 Repaso de grados anteriores</h3>
              <div className="grid grid-cols-2 gap-3">
                {reviewTopics.map(t => (
                  <TopicCard
                    key={t.id}
                    topic={t}
                    level={1}
                    badge={`${gradeLabel(t.gradeLevel)} básico`}
                    badgeClass="bg-blue-100 text-blue-700"
                    onClick={() => setChosenTopicId(t.id)}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    )
  }

  return (
    <TopicPractice
      topic={chosenTopic}
      onExit={() => setChosenTopicId(null)}
      progressLevel={getTopicLevel?.(chosenTopicId) || 1}
      isReview={chosenTopic.gradeLevel < grade}
      onLevelUp={(lvl) => setTopicLevel?.(chosenTopicId, lvl)}
      saveAttempt={saveAttempt}
    />
  )
}

function TopicCard({ topic, level, badge, badgeClass, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-left bg-white rounded-2xl border-2 border-magic-100 hover:border-magic-400 active:scale-95 transition-all p-3 shadow-sm"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl">{topic.icon}</span>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeClass}`}>
          {badge}
        </span>
      </div>
      <div className="text-sm font-black text-gray-800 leading-tight">{topic.title}</div>
      <div className="text-xs text-gray-400 mt-1 line-clamp-2">{topic.description}</div>
      <div className="mt-2 flex items-center gap-1 text-[10px] text-magic-500">
        {Array.from({ length: 5 }).map((_, i) => (
          <span key={i} className={i < level ? 'text-magic-500' : 'text-magic-200'}>●</span>
        ))}
        <span className="ml-1 font-bold">Nivel {level}</span>
      </div>
    </button>
  )
}

function TopicPractice({ topic, onExit, progressLevel, isReview, onLevelUp, saveAttempt }) {
  const [currentLevel, setCurrentLevel] = useState(progressLevel)
  const [exercises, setExercises] = useState(() => topic.generateExercises(EXERCISE_COUNT, progressLevel))
  const [exIndex, setExIndex] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [phase, setPhase] = useState('practice') // 'practice' | 'complete'
  const [showWhiteboard, setShowWhiteboard] = useState(true)
  const whiteboardRef = useRef(null)
  const [showCelebration, setShowCelebration] = useState(false)

  useEffect(() => { whiteboardRef.current?.clear() }, [exIndex])

  const handleCorrect = useCallback((xp) => {
    saveAttempt(topic.id, true, xp)
    setCorrectCount(c => c + 1)
  }, [topic.id, saveAttempt])

  const handleWrong = useCallback(() => {
    saveAttempt(topic.id, false, 0)
  }, [topic.id, saveAttempt])

  function handleNext() {
    // Clear pizarra automatically — already runs via useEffect on exIndex change.
    if (exIndex + 1 < exercises.length) {
      setExIndex(i => i + 1)
    } else {
      setPhase('complete')
      setShowCelebration(true)
    }
  }

  function practiceMore() {
    const accuracy = exercises.length ? correctCount / exercises.length : 0
    const shouldBump = accuracy >= 0.7 && currentLevel < 5 && !isReview
    const nextLevel = shouldBump ? currentLevel + 1 : currentLevel
    if (shouldBump) onLevelUp(nextLevel)
    setCurrentLevel(nextLevel)
    setExercises(topic.generateExercises(EXERCISE_COUNT, nextLevel))
    setExIndex(0)
    setCorrectCount(0)
    setShowCelebration(false)
    setPhase('practice')
    whiteboardRef.current?.clear()
  }

  const accuracy = exercises.length ? correctCount / exercises.length : 0
  const stars = accuracy >= 0.9 ? 3 : accuracy >= 0.7 ? 2 : 1
  const currentExercise = exercises[exIndex]

  return (
    <div className="pb-24">
      <TopBar title={topic.title} showXP />
      <Celebration
        show={showCelebration}
        message={`¡Ronda completa! ${'⭐'.repeat(stars)}`}
        xp={correctCount * (currentExercise?.xpReward || 10)}
        onDone={() => setShowCelebration(false)}
      />
      <div className="page-shell pt-4">
        <button
          type="button"
          onClick={onExit}
          className="text-sm font-bold text-magic-600 mb-2"
        >
          ← Volver a elegir tema
        </button>

        {isReview ? (
          <div className="mb-3 rounded-2xl bg-blue-50 border border-blue-200 px-3 py-2 text-xs font-bold text-blue-700 text-center">
            🔁 Repaso · {topic.title}
          </div>
        ) : (
          <div className="mb-3 rounded-2xl bg-magic-50 border border-magic-200 px-3 py-2 text-xs font-bold text-magic-700 text-center">
            Nivel {currentLevel} · {Array.from({ length: 5 }).map((_, i) => i < currentLevel ? '●' : '○').join('')}
          </div>
        )}

        {phase === 'practice' && currentExercise && (
          <>
            <div className="mb-4">
              <div className="flex justify-between text-sm font-bold text-gray-500 mb-1">
                <span>Ejercicio {exIndex + 1} de {exercises.length}</span>
                <span>✅ {correctCount}</span>
              </div>
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-magic-500 to-primary-500 rounded-full transition-all duration-500"
                  style={{ width: `${(exIndex / exercises.length) * 100}%` }}
                />
              </div>
            </div>

            <ExerciseEngine
              key={`${exIndex}-${currentExercise.id}`}
              exercise={currentExercise}
              onCorrect={handleCorrect}
              onWrong={handleWrong}
              onNext={handleNext}
            />

            <div className="mt-4">
              <button
                type="button"
                onClick={() => setShowWhiteboard(v => !v)}
                className="text-sm font-bold text-magic-600 active:scale-95 transition-all"
              >
                {showWhiteboard ? '🙈 Ocultar pizarra' : '📝 Mostrar pizarra'}
              </button>
              {showWhiteboard && (
                <div className="mt-2">
                  <Whiteboard ref={whiteboardRef} height={220} />
                  <p className="text-xs text-gray-400 text-center mt-1">
                    La pizarra se limpia sola al pasar al siguiente ejercicio.
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
              <h2 className="text-2xl font-black text-yellow-700">¡Ronda completa!</h2>
              <div className="flex justify-center gap-1 my-3">
                {[1, 2, 3].map(s => (
                  <span key={s} className={`text-4xl transition-all ${s <= stars ? 'text-yellow-400 animate-sparkle' : 'text-gray-200'}`}>★</span>
                ))}
              </div>
              <p className="text-gray-600 font-semibold">{correctCount}/{exercises.length} correctos</p>
            </div>

            <button type="button" onClick={practiceMore} className="btn-primary w-full text-lg">
              {accuracy >= 0.7 && currentLevel < 5 && !isReview
                ? `🚀 Practicar más · Subir a Nivel ${currentLevel + 1}`
                : '🔁 Practicar más'}
            </button>

            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={onExit} className="btn-ghost">
                ↩️ Otro tema
              </button>
              <button type="button" onClick={() => navigate('/map')} className="btn-secondary">
                🗺️ Mapa
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
