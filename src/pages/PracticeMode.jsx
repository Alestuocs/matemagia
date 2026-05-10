import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CURRICULUM, gradeLabel } from '../lib/curriculum'
import { useProgress } from '../contexts/ProgressContext'
import TopBar from '../components/layout/TopBar'
import Celebration from '../components/ui/Celebration'

export default function PracticeMode() {
  const navigate = useNavigate()
  const { progress, saveAttempt } = useProgress()

  const maxGrade = progress.currentGrade || 1
  const [practiceGrade, setPracticeGrade] = useState(maxGrade)

  const [score, setScore] = useState({ correct: 0, total: 0 })
  const [showCelebration, setShowCelebration] = useState(false)
  const [streak, setStreak] = useState(0)
  const [showExplanation, setShowExplanation] = useState(false)
  const [lastAnswer, setLastAnswer] = useState(null)
  const [userInput, setUserInput] = useState('')
  const [feedback, setFeedback] = useState(null) // null | 'correct' | 'wrong'

  const [seenHashes] = useState(new Set())

  // Filter topics: 60% from current practice grade, 40% from previous grades
  const currentGradeTopics = CURRICULUM.filter(t => t.gradeLevel === practiceGrade)
  const prevGradeTopics = CURRICULUM.filter(t => t.gradeLevel < practiceGrade)

  const availableTopics = CURRICULUM.filter(t => t.gradeLevel <= practiceGrade)

  function getWeightedTopic() {
    if (availableTopics.length === 0) return null
    // 60% chance pick from current grade, 40% from previous
    const useCurrentGrade = (currentGradeTopics.length > 0) &&
      (prevGradeTopics.length === 0 || Math.random() < 0.6)
    const pool = useCurrentGrade ? currentGradeTopics : (prevGradeTopics.length > 0 ? prevGradeTopics : currentGradeTopics)
    return pool[Math.floor(Math.random() * pool.length)]
  }

  function generateExercise() {
    if (availableTopics.length === 0) return null
    const topic = getWeightedTopic()
    if (!topic) return null

    let exercises = topic.generateExercises(10)
    let exercise = null
    for (const ex of exercises) {
      const hash = `${topic.id}-${ex.question}`
      if (!seenHashes.has(hash)) {
        seenHashes.add(hash)
        exercise = { ...ex, topicId: topic.id, topicTitle: topic.title, topicIcon: topic.icon }
        break
      }
    }
    if (!exercise) {
      const ex = exercises[Math.floor(Math.random() * exercises.length)]
      exercise = { ...ex, topicId: topic.id, topicTitle: topic.title, topicIcon: topic.icon }
    }
    return exercise
  }

  const [currentExercise, setCurrentExercise] = useState(() => generateExercise())

  function nextExercise() {
    setFeedback(null)
    setShowExplanation(false)
    setUserInput('')
    setLastAnswer(null)
    setCurrentExercise(generateExercise())
  }

  function handleAnswer(answer) {
    if (feedback) return
    const ex = currentExercise
    const correct = String(answer).trim().toLowerCase() === String(ex.answer).trim().toLowerCase() ||
      Math.abs(parseFloat(answer) - parseFloat(ex.answer)) < 0.01

    setLastAnswer(answer)
    setFeedback(correct ? 'correct' : 'wrong')
    saveAttempt(ex.topicId, correct, ex.xpReward || 10)

    if (correct) {
      const newStreak = streak + 1
      setStreak(newStreak)
      setScore(s => ({ correct: s.correct + 1, total: s.total + 1 }))
      if (newStreak % 5 === 0) setShowCelebration(true)
      setTimeout(() => nextExercise(), 1500)
    } else {
      setStreak(0)
      setScore(s => ({ ...s, total: s.total + 1 }))
      setShowExplanation(true)
    }
  }

  function handleGradeChange(g) {
    setPracticeGrade(g)
    setFeedback(null)
    setShowExplanation(false)
    setUserInput('')
    setLastAnswer(null)
    // Regenerate exercise for new grade
    setTimeout(() => setCurrentExercise(generateExercise()), 0)
  }

  if (!currentExercise) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-yellow-50 flex-col gap-4 p-6">
      <div className="text-5xl">📚</div>
      <p className="text-gray-500 font-bold text-center">No hay ejercicios disponibles. Completa más lecciones primero.</p>
      <button onClick={() => navigate('/')} className="btn-primary">Ir al inicio</button>
    </div>
  )

  const ex = currentExercise
  const accuracy = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-yellow-50 flex flex-col pb-20">
      {showCelebration && <Celebration onDone={() => setShowCelebration(false)} message={`¡${streak} seguidas! 🔥`} />}

      <TopBar title="⚡ Modo Práctica" onBack={() => navigate(-1)} />

      {/* Grade filter */}
      <div className="px-4 pt-3 pb-2">
        <div className="bg-white rounded-2xl px-4 py-2 shadow-sm border border-purple-100 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="text-xs font-bold text-gray-500 whitespace-nowrap flex-shrink-0">Practicando hasta:</span>
          <div className="flex gap-1">
            {Array.from({ length: maxGrade }, (_, i) => i + 1).map(g => (
              <button
                key={g}
                onClick={() => handleGradeChange(g)}
                className={`flex-shrink-0 px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                  practiceGrade === g
                    ? 'bg-purple-600 text-white'
                    : 'bg-purple-50 text-purple-600 hover:bg-purple-100'
                }`}
              >
                {gradeLabel(g)}
              </button>
            ))}
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-1 px-1">
          Practicando: hasta {gradeLabel(practiceGrade)} Básico · 60% de {gradeLabel(practiceGrade)}, 40% de grados anteriores
        </p>
      </div>

      {/* Stats bar */}
      <div className="flex gap-3 px-4 py-2">
        <div className="flex-1 bg-white rounded-2xl p-3 text-center shadow-sm">
          <div className="text-2xl font-black text-green-600">{score.correct}</div>
          <div className="text-xs text-gray-500 font-semibold">Correctas</div>
        </div>
        <div className="flex-1 bg-white rounded-2xl p-3 text-center shadow-sm">
          <div className="text-2xl font-black text-orange-500">{streak}</div>
          <div className="text-xs text-gray-500 font-semibold">Racha 🔥</div>
        </div>
        <div className="flex-1 bg-white rounded-2xl p-3 text-center shadow-sm">
          <div className="text-2xl font-black text-purple-600">{accuracy}%</div>
          <div className="text-xs text-gray-500 font-semibold">Precisión</div>
        </div>
      </div>

      {/* Topic badge */}
      <div className="px-4 mb-2">
        <span className="bg-purple-100 text-purple-700 font-bold text-sm px-3 py-1 rounded-full">
          {ex.topicIcon} {ex.topicTitle}
        </span>
      </div>

      {/* Question */}
      <div className="px-4">
        <div className={`bg-white rounded-3xl p-6 shadow-md border-2 transition-all ${
          feedback === 'correct' ? 'border-green-400' :
          feedback === 'wrong' ? 'border-red-400' : 'border-purple-100'
        }`}>
          {ex.visualHint && (
            <div className="text-center text-3xl mb-3 bg-purple-50 rounded-2xl p-3">{ex.visualHint}</div>
          )}
          <p className="text-xl font-black text-gray-800 text-center mb-4">{ex.question}</p>

          {/* Answer options or input */}
          {ex.type === 'multiple-choice' && ex.options ? (
            <div className="grid grid-cols-2 gap-3">
              {ex.options.map((opt, i) => {
                let cls = 'py-4 rounded-2xl font-black text-lg border-2 transition-all active:scale-95 text-center'
                if (feedback) {
                  const isCorrect = String(opt) === String(ex.answer)
                  const isSelected = String(opt) === String(lastAnswer)
                  cls += isCorrect ? ' bg-green-100 border-green-500 text-green-700' :
                    isSelected ? ' bg-red-100 border-red-400 text-red-700' : ' opacity-50 border-gray-200'
                } else {
                  cls += ' bg-white border-gray-200 text-gray-800 hover:border-purple-400 hover:bg-purple-50'
                }
                return (
                  <button key={i} onClick={() => handleAnswer(opt)} disabled={!!feedback} className={cls}>
                    {opt}
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                value={userInput}
                onChange={e => setUserInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !feedback && userInput && handleAnswer(userInput)}
                placeholder="Tu respuesta..."
                disabled={!!feedback}
                className="flex-1 border-2 border-gray-200 rounded-2xl px-4 py-3 text-xl font-black text-center focus:outline-none focus:border-purple-400"
              />
              {!feedback && (
                <button onClick={() => userInput && handleAnswer(userInput)}
                  className="bg-purple-600 text-white rounded-2xl px-5 font-black text-lg active:scale-95">
                  ✓
                </button>
              )}
            </div>
          )}

          {/* Feedback */}
          {feedback === 'correct' && (
            <div className="mt-4 text-center">
              <p className="text-green-600 font-black text-lg">¡Correcto! 🎉</p>
              <p className="text-green-500 text-sm">+{ex.xpReward || 10} XP</p>
            </div>
          )}

          {feedback === 'wrong' && (
            <div className="mt-4 space-y-3">
              <p className="text-red-500 font-black text-center">¡Casi! La respuesta es <span className="text-green-600">{ex.answer}</span></p>

              {showExplanation && ex.explanation && (
                <div className="bg-blue-50 rounded-2xl p-4 border border-blue-200">
                  <p className="font-black text-blue-800 mb-2">📖 Explicación paso a paso:</p>
                  <p className="text-blue-700 text-sm whitespace-pre-line">{ex.explanation}</p>
                </div>
              )}

              {ex.hint && (
                <div className="bg-yellow-50 rounded-2xl p-3 border border-yellow-200">
                  <p className="text-yellow-800 font-semibold text-sm">💡 {ex.hint}</p>
                </div>
              )}

              <button onClick={nextExercise}
                className="w-full bg-purple-600 text-white rounded-2xl py-3 font-black text-lg active:scale-95">
                Siguiente ejercicio ➤
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Hint button */}
      {!feedback && ex.hint && (
        <div className="px-4 mt-3">
          <details className="bg-yellow-50 border border-yellow-200 rounded-2xl">
            <summary className="px-4 py-3 font-bold text-yellow-800 cursor-pointer text-sm">💡 Ver pista</summary>
            <div className="px-4 pb-3 text-yellow-700 text-sm">{ex.hint}</div>
          </details>
        </div>
      )}
    </div>
  )
}
