import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CURRICULUM } from '../lib/curriculum'
import { useProgress } from '../contexts/ProgressContext'
import TopBar from '../components/layout/TopBar'
import Celebration from '../components/ui/Celebration'

export default function PracticeMode() {
  const navigate = useNavigate()
  const { progress, saveAttempt } = useProgress()
  const [score, setScore] = useState({ correct: 0, total: 0 })
  const [showCelebration, setShowCelebration] = useState(false)
  const [streak, setStreak] = useState(0)
  const [showExplanation, setShowExplanation] = useState(false)
  const [lastAnswer, setLastAnswer] = useState(null)
  const [userInput, setUserInput] = useState('')
  const [feedback, setFeedback] = useState(null) // null | 'correct' | 'wrong'

  // Track shown exercise hashes in session (simple in-memory for now)
  const [seenHashes] = useState(new Set())

  // Get unlocked topics for practice
  const availableTopics = CURRICULUM.filter(t =>
    progress.unlockedTopics?.includes(t.id) || t.gradeLevel <= (progress.currentGrade || 1)
  )

  function generateExercise() {
    if (availableTopics.length === 0) return null
    // Pick random topic from available
    const topic = availableTopics[Math.floor(Math.random() * availableTopics.length)]
    if (!topic) return null

    // Generate exercises and find one not seen
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
    // If all seen, just pick random (reset mental model)
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

      {/* Stats bar */}
      <div className="flex gap-3 px-4 py-3">
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
                type="number"
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
