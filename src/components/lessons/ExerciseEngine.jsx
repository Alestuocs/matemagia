import { useState, useRef, useEffect } from 'react'
import FeedbackPanel from './FeedbackPanel'
import Celebration from '../ui/Celebration'

export default function ExerciseEngine({ exercise, onCorrect, onWrong, onNext }) {
  const [selected, setSelected] = useState(null)
  const [inputVal, setInputVal] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [wrongCount, setWrongCount] = useState(0)
  const [showCelebration, setShowCelebration] = useState(false)
  const [shake, setShake] = useState(false)
  const inputRef = useRef()

  // Reset state when exercise changes
  useEffect(() => {
    setSelected(null)
    setInputVal('')
    setSubmitted(false)
    setIsCorrect(false)
    setShowHint(false)
    setShake(false)
    setShowCelebration(false)
    if (exercise.type === 'write-answer') {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [exercise.id])

  function checkAnswer(userAnswer) {
    const correct = String(exercise.answer).trim().toLowerCase()
    const user = String(userAnswer).trim().toLowerCase()
    // For numbers, compare numerically if possible
    const numCorrect = parseFloat(correct)
    const numUser = parseFloat(user)
    return (!isNaN(numCorrect) && !isNaN(numUser))
      ? Math.abs(numCorrect - numUser) < 0.001
      : correct === user
  }

  function handleSubmit(answer) {
    if (submitted) return
    const correct = checkAnswer(answer)
    setSelected(String(answer))
    setSubmitted(true)
    setIsCorrect(correct)

    if (correct) {
      setShowCelebration(true)
      onCorrect?.(exercise.xpReward || 10)
    } else {
      setShake(true)
      setWrongCount(c => c + 1)
      setTimeout(() => setShake(false), 500)
      onWrong?.()
    }
  }

  function handleNext() {
    onNext?.()
  }

  const { type, question, options, visualHint } = exercise

  return (
    <div className="space-y-4">
      <Celebration
        show={showCelebration}
        message="¡Correcto! 🎉"
        xp={exercise.xpReward || 10}
        onDone={() => {
          setShowCelebration(false)
          setTimeout(handleNext, 400)
        }}
      />

      {/* Question */}
      <div className={`card border-2 border-magic-200 bg-gradient-to-br from-purple-50 to-white ${shake ? 'animate-shake' : ''}`}>
        <div className="text-lg font-black text-gray-800 whitespace-pre-line mb-2">{question}</div>
        {visualHint && (
          <div className="text-2xl mt-2 leading-relaxed break-words bg-white rounded-xl p-3 border border-magic-100">
            {visualHint}
          </div>
        )}
      </div>

      {/* Hint button */}
      {!submitted && !showHint && (
        <button
          onClick={() => setShowHint(true)}
          className="text-sm text-gray-400 hover:text-magic-500 font-semibold flex items-center gap-1 mx-auto"
        >
          💡 Necesito una pista
        </button>
      )}
      {showHint && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-3 animate-pop">
          <p className="text-sm font-semibold text-yellow-700">💡 {exercise.hint}</p>
        </div>
      )}

      {/* Answer UI */}
      {!submitted && type === 'multiple-choice' && (
        <div className="grid grid-cols-2 gap-3">
          {(options || []).map((opt, i) => (
            <button
              key={i}
              onClick={() => handleSubmit(opt)}
              className="option-btn text-center text-xl font-black py-5"
            >
              {opt}
            </button>
          ))}
        </div>
      )}

      {!submitted && type === 'write-answer' && (
        <form onSubmit={e => { e.preventDefault(); handleSubmit(inputVal) }} className="space-y-3">
          <input
            ref={inputRef}
            type="text"
            inputMode="decimal"
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            placeholder="Tu respuesta..."
            className="w-full text-3xl font-black text-center border-2 border-magic-300 rounded-2xl p-4 focus:outline-none focus:border-magic-500 bg-white"
          />
          <button
            type="submit"
            disabled={!inputVal.trim()}
            className="btn-primary w-full text-lg disabled:opacity-50"
          >
            Verificar ✓
          </button>
        </form>
      )}

      {!submitted && type === 'true-false' && (
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => handleSubmit('verdadero')}
            className="option-btn text-center py-6 border-green-300 hover:bg-green-50 text-green-700"
          >
            <div className="text-3xl">✅</div>
            <div className="font-black mt-1">Verdadero</div>
          </button>
          <button
            onClick={() => handleSubmit('falso')}
            className="option-btn text-center py-6 border-red-300 hover:bg-red-50 text-red-700"
          >
            <div className="text-3xl">❌</div>
            <div className="font-black mt-1">Falso</div>
          </button>
        </div>
      )}

      {/* After submission */}
      {submitted && isCorrect && (
        <div className="card border-2 border-green-300 bg-green-50 animate-pop text-center">
          <div className="text-4xl mb-2">🎉</div>
          <p className="font-black text-green-700 text-xl">¡Excelente!</p>
          <p className="text-green-600 font-semibold mt-1">+{exercise.xpReward || 10} XP ⭐</p>
          {exercise.explanation && (
            <div className="mt-3 text-left bg-white rounded-xl p-3 text-sm text-gray-600 whitespace-pre-line">
              {exercise.explanation}
            </div>
          )}
        </div>
      )}

      {submitted && !isCorrect && (
        <FeedbackPanel
          exercise={exercise}
          wrongCount={wrongCount}
          onNext={handleNext}
        />
      )}

      {/* Show selected options with colors */}
      {submitted && type === 'multiple-choice' && (
        <div className="grid grid-cols-2 gap-3">
          {(options || []).map((opt, i) => {
            const isAnswer = String(opt) === String(exercise.answer)
            const isSelected = String(opt) === selected
            return (
              <div
                key={i}
                className={`option-btn text-center text-xl font-black py-5 pointer-events-none
                  ${isAnswer ? 'option-btn-correct' : isSelected && !isAnswer ? 'option-btn-wrong' : 'opacity-50'}`}
              >
                {opt}
                {isAnswer && ' ✓'}
                {isSelected && !isAnswer && ' ✗'}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
