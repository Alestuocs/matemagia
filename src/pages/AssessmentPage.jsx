import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProgress } from '../contexts/ProgressContext'

const ASSESSMENT_QUESTIONS = [
  { question: '¿Cuánto es 3 + 4?', answer: 7, grade: 1 },
  { question: '¿Cuánto es 10 - 3?', answer: 7, grade: 1 },
  { question: '¿Cuánto es 15 + 12?', answer: 27, grade: 2 },
  { question: '¿Cuánto es 30 - 14?', answer: 16, grade: 2 },
  { question: '¿Cuánto es 5 × 4?', answer: 20, grade: 3 },
  { question: '¿Cuánto es 24 ÷ 6?', answer: 4, grade: 3 },
  { question: '¿Cuánto es 23 × 4?', answer: 92, grade: 4 },
  { question: '¿Cuánto es 3/4 de 20?', answer: 15, grade: 5 },
  { question: '¿Cuánto es 1,5 + 2,3?', answer: 3.8, grade: 5 },
  { question: '¿Cuánto es el 25% de 80?', answer: 20, grade: 6 },
]

function makeOpts(correct) {
  const opts = new Set([correct])
  while (opts.size < 4) {
    const delta = Math.floor(Math.random() * 10) + 1
    opts.add(Math.random() < 0.5 ? correct + delta : Math.max(0, correct - delta))
  }
  return [...opts].sort(() => Math.random() - 0.5).map(String)
}

export default function AssessmentPage() {
  const navigate = useNavigate()
  const { setProfile } = useProgress()

  const [step, setStep] = useState('name') // name | grade | questions | results
  const [name, setName] = useState('')
  const [grade, setGrade] = useState(null)
  const [qIndex, setQIndex] = useState(0)
  const [answers, setAnswers] = useState([])
  const [selectedOpt, setSelectedOpt] = useState(null)
  const [showResult, setShowResult] = useState(false)

  const questions = ASSESSMENT_QUESTIONS.filter(q => q.grade <= (grade || 6))

  function handleAnswer(opt) {
    if (showResult) return
    setSelectedOpt(opt)
    setShowResult(true)
    const q = questions[qIndex]
    const correct = Math.abs(parseFloat(opt) - q.answer) < 0.001
    setTimeout(() => {
      setAnswers(prev => [...prev, { ...q, userAnswer: opt, correct }])
      setShowResult(false)
      setSelectedOpt(null)
      if (qIndex + 1 < questions.length) {
        setQIndex(i => i + 1)
      } else {
        setStep('results')
      }
    }, 1000)
  }

  function handleFinish() {
    const correctByGrade = {}
    answers.forEach(a => {
      if (!correctByGrade[a.grade]) correctByGrade[a.grade] = { correct: 0, total: 0 }
      correctByGrade[a.grade].total++
      if (a.correct) correctByGrade[a.grade].correct++
    })

    // Recommend grade: last grade with >50% correct
    let recommended = 1
    for (let g = 1; g <= 6; g++) {
      const data = correctByGrade[g]
      if (data && data.correct / data.total >= 0.5) {
        recommended = g
      }
    }

    setProfile(name || 'Estudiante', grade || recommended)
    navigate('/map')
  }

  if (step === 'name') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 to-yellow-50 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-6 animate-slide-up">
          <div className="text-center">
            <div className="text-6xl mb-3">👋</div>
            <h1 className="text-2xl font-black text-magic-700">¿Cómo te llamas?</h1>
            <p className="text-gray-500 font-semibold mt-1">Así podré llamarte mientras aprendemos</p>
          </div>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Tu nombre..."
            className="w-full text-2xl font-black text-center border-2 border-magic-300 rounded-2xl p-4 focus:outline-none focus:border-magic-500"
            autoFocus
          />
          <button
            onClick={() => name.trim() && setStep('grade')}
            disabled={!name.trim()}
            className="btn-primary w-full text-lg disabled:opacity-50"
          >
            ¡Hola, {name || '...'}! 🎉
          </button>
        </div>
      </div>
    )
  }

  if (step === 'grade') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 to-yellow-50 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-4 animate-slide-up">
          <div className="text-center mb-6">
            <div className="text-5xl mb-2">📚</div>
            <h1 className="text-2xl font-black text-magic-700">¿En qué curso estás?</h1>
            <p className="text-gray-500 font-semibold">{name}, ¡elige tu grado!</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4, 5, 6].map(g => (
              <button
                key={g}
                onClick={() => { setGrade(g); setStep('questions') }}
                className={`py-5 rounded-2xl font-black text-xl border-2 transition-all active:scale-95 ${
                  grade === g
                    ? 'bg-magic-500 text-white border-magic-500'
                    : 'bg-white border-magic-200 text-magic-700 hover:bg-magic-50'
                }`}
              >
                <div className="text-3xl">{'🌱🌿🌳🦋🚀🌟'[g - 1]}</div>
                <div className="mt-1">{g}ro Básico</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (step === 'questions') {
    const q = questions[qIndex]
    const opts = makeOpts(q.answer)
    const progress = ((qIndex) / questions.length) * 100

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 to-yellow-50 p-4 flex flex-col">
        <div className="max-w-sm mx-auto w-full flex-1 flex flex-col gap-4 pt-6">
          {/* Progress */}
          <div>
            <div className="flex justify-between text-sm font-bold text-gray-500 mb-1">
              <span>Pregunta {qIndex + 1} de {questions.length}</span>
              <span>🌟 {answers.filter(a => a.correct).length} correctas</span>
            </div>
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-magic-500 to-primary-500 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="card border-2 border-magic-200 text-center animate-pop">
            <div className="text-2xl font-black text-gray-800 py-4">{q.question}</div>
          </div>

          <div className="grid grid-cols-2 gap-3 flex-1 content-start">
            {opts.map((opt, i) => {
              let cls = 'option-btn text-center text-2xl font-black py-6'
              if (showResult && selectedOpt) {
                const isCorrectOpt = Math.abs(parseFloat(opt) - q.answer) < 0.001
                const isSelected = opt === selectedOpt
                if (isCorrectOpt) cls += ' option-btn-correct'
                else if (isSelected) cls += ' option-btn-wrong'
                else cls += ' opacity-50'
              }
              return (
                <button key={i} onClick={() => handleAnswer(opt)} className={cls} disabled={showResult}>
                  {opt}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  if (step === 'results') {
    const correct = answers.filter(a => a.correct).length
    const pct = Math.round((correct / answers.length) * 100)
    const emoji = pct >= 80 ? '🌟' : pct >= 50 ? '😊' : '💪'

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 to-yellow-50 p-4 flex flex-col items-center justify-center">
        <div className="max-w-sm w-full space-y-5 animate-pop">
          <div className="card text-center border-2 border-magic-200">
            <div className="text-6xl mb-3">{emoji}</div>
            <h2 className="text-2xl font-black text-magic-700 mb-1">¡Evaluación completa, {name}!</h2>
            <div className="text-4xl font-black text-primary-500 my-3">{correct}/{answers.length}</div>
            <p className="text-gray-500 font-semibold">{pct}% de respuestas correctas</p>
          </div>

          <div className="card space-y-2">
            {answers.map((a, i) => (
              <div key={i} className={`flex items-center gap-3 p-2 rounded-xl ${a.correct ? 'bg-green-50' : 'bg-red-50'}`}>
                <span className="text-xl">{a.correct ? '✅' : '❌'}</span>
                <span className="text-sm font-semibold text-gray-700 flex-1">{a.question}</span>
                {!a.correct && <span className="text-sm text-green-600 font-bold">→ {a.answer}</span>}
              </div>
            ))}
          </div>

          <button onClick={handleFinish} className="btn-primary w-full text-lg">
            ¡Empecemos a aprender! 🚀
          </button>
        </div>
      </div>
    )
  }

  return null
}
