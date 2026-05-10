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

const GRADE_EMOJIS = ['🌱', '🌿', '🌳', '🦋', '🚀', '🌟']

const GRADE_DESCRIPTIONS = [
  'Números, sumas y restas básicas',
  'Sumas y restas con dos dígitos',
  'Multiplicación y división',
  'Números grandes y fracciones simples',
  'Fracciones, decimales y porcentajes',
  'Ecuaciones y matemáticas avanzadas',
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

  const [step, setStep] = useState('name') // name | parent | grade | confirm | questions | results
  const [name, setName] = useState('')
  const [parentEmail, setParentEmail] = useState('')
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

    setProfile(name || 'Estudiante', grade || recommended, parentEmail)
    navigate('/map')
  }

  // ── Step: Name ──────────────────────────────────
  if (step === 'name') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 to-yellow-50 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-6 animate-slide-up">
          <div className="text-center">
            <div className="text-7xl mb-4 animate-float">👋</div>
            <h1 className="text-3xl font-black text-magic-700">¡Bienvenido a MateMagia!</h1>
            <p className="text-gray-500 font-semibold mt-2">¿Cómo te llamas?</p>
          </div>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && name.trim() && setStep('parent')}
            placeholder="Tu nombre..."
            className="w-full text-2xl font-black text-center border-2 border-magic-300 rounded-2xl p-4 focus:outline-none focus:border-magic-500 bg-white"
            autoFocus
          />
          <button
            onClick={() => name.trim() && setStep('parent')}
            disabled={!name.trim()}
            className="btn-primary w-full text-lg disabled:opacity-50"
          >
            ¡Hola, {name || '...'}! 🎉
          </button>
        </div>
      </div>
    )
  }

  // ── Step: Parent email ──────────────────────────
  if (step === 'parent') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 to-yellow-50 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-6 animate-slide-up">
          <div className="text-center">
            <div className="text-6xl mb-3">📧</div>
            <h1 className="text-2xl font-black text-magic-700">Email del papá/mamá</h1>
            <p className="text-gray-500 font-semibold mt-1">Para enviarte reportes de progreso</p>
            <p className="text-xs text-gray-400 mt-1">(opcional — puedes dejarlo en blanco)</p>
          </div>
          <input
            type="email"
            value={parentEmail}
            onChange={e => setParentEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && setStep('grade')}
            placeholder="correo@ejemplo.com"
            className="w-full text-lg font-semibold text-center border-2 border-magic-300 rounded-2xl p-4 focus:outline-none focus:border-magic-500 bg-white"
            autoFocus
          />
          <button
            onClick={() => setStep('grade')}
            className="btn-primary w-full text-lg"
          >
            {parentEmail.trim() ? '¡Guardado! ✅' : 'Saltar por ahora →'}
          </button>
          <button onClick={() => setStep('name')} className="btn-ghost w-full text-sm">
            ← Volver
          </button>
        </div>
      </div>
    )
  }

  // ── Step: Grade ─────────────────────────────────
  if (step === 'grade') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 to-yellow-50 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-4 animate-slide-up">
          <div className="text-center mb-4">
            <div className="text-5xl mb-2">📚</div>
            <h1 className="text-2xl font-black text-magic-700">¿En qué curso estás?</h1>
            <p className="text-gray-500 font-semibold">{name}, ¡elige tu grado!</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4, 5, 6].map(g => (
              <button
                key={g}
                onClick={() => { setGrade(g); setStep('confirm') }}
                className={`py-5 px-3 rounded-2xl font-black border-2 transition-all active:scale-95 text-left ${
                  grade === g
                    ? 'bg-magic-500 text-white border-magic-500'
                    : 'bg-white border-magic-200 text-magic-700 hover:bg-magic-50 hover:border-magic-400'
                }`}
              >
                <div className="text-4xl text-center">{GRADE_EMOJIS[g - 1]}</div>
                <div className="mt-2 text-center text-base">{g}ro Básico</div>
                <div className={`text-xs mt-1 text-center font-semibold ${grade === g ? 'text-purple-100' : 'text-gray-400'}`}>
                  {GRADE_DESCRIPTIONS[g - 1]}
                </div>
              </button>
            ))}
          </div>
          <button onClick={() => setStep('parent')} className="btn-ghost w-full text-sm">
            ← Volver
          </button>
        </div>
      </div>
    )
  }

  // ── Step: Confirm grade before questions ─────────
  if (step === 'confirm') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 to-yellow-50 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-6 animate-pop text-center">
          <div className="text-8xl">{GRADE_EMOJIS[grade - 1]}</div>
          <div>
            <h1 className="text-3xl font-black text-magic-700">{grade}ro Básico</h1>
            <p className="text-gray-500 font-semibold mt-2">{GRADE_DESCRIPTIONS[grade - 1]}</p>
          </div>
          <div className="card bg-yellow-50 border-yellow-200">
            <p className="font-bold text-yellow-700 text-sm">
              💡 Ahora haremos una pequeña evaluación para personalizar tu aprendizaje. ¡Sin presión, es solo para conocerte mejor!
            </p>
          </div>
          <button onClick={() => setStep('questions')} className="btn-primary w-full text-lg">
            ¡Hacer evaluación! 🚀
          </button>
          <button
            onClick={() => {
              setProfile(name || 'Estudiante', grade, parentEmail)
              navigate('/map')
            }}
            className="btn-ghost w-full text-sm"
          >
            Saltar evaluación e ir al mapa →
          </button>
          <button onClick={() => setStep('grade')} className="text-sm text-gray-400 font-semibold">
            ← Cambiar grado
          </button>
        </div>
      </div>
    )
  }

  // ── Step: Questions ─────────────────────────────
  if (step === 'questions') {
    const q = questions[qIndex]
    const opts = makeOpts(q.answer)
    const progressPct = (qIndex / questions.length) * 100

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
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          <div className="card border-2 border-magic-200 text-center animate-pop">
            <div className="text-xs font-bold text-magic-400 mb-1">Nivel {q.grade}ro básico</div>
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

  // ── Step: Results ───────────────────────────────
  if (step === 'results') {
    const correct = answers.filter(a => a.correct).length
    const pct = Math.round((correct / answers.length) * 100)
    const emoji = pct >= 80 ? '🌟' : pct >= 50 ? '😊' : '💪'

    const correctByGrade = {}
    answers.forEach(a => {
      if (!correctByGrade[a.grade]) correctByGrade[a.grade] = { correct: 0, total: 0 }
      correctByGrade[a.grade].total++
      if (a.correct) correctByGrade[a.grade].correct++
    })
    let recommended = 1
    for (let g = 1; g <= 6; g++) {
      const data = correctByGrade[g]
      if (data && data.correct / data.total >= 0.5) recommended = g
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 to-yellow-50 p-4 flex flex-col items-center justify-center">
        <div className="max-w-sm w-full space-y-5 animate-pop">
          <div className="card text-center border-2 border-magic-200">
            <div className="text-7xl mb-3">{emoji}</div>
            <h2 className="text-2xl font-black text-magic-700 mb-1">¡Evaluación completa!</h2>
            <h3 className="text-lg font-bold text-gray-600 mb-3">¡Muy bien, {name}!</h3>
            <div className="text-5xl font-black text-primary-500 my-3">{correct}/{answers.length}</div>
            <p className="text-gray-500 font-semibold">{pct}% de respuestas correctas</p>
          </div>

          <div className="card bg-purple-50 border-magic-200 text-center">
            <p className="text-sm font-bold text-magic-600">
              Según tu evaluación, empezaremos con contenidos de
            </p>
            <div className="text-2xl font-black text-magic-700 mt-1">
              {GRADE_EMOJIS[recommended - 1]} {recommended}ro Básico
            </div>
            {recommended !== grade && (
              <p className="text-xs text-gray-400 mt-1">
                (seleccionaste {grade}ro, pero tu evaluación sugiere {recommended}ro)
              </p>
            )}
          </div>

          <div className="card space-y-2">
            <h3 className="font-black text-gray-700 mb-2">Tus respuestas:</h3>
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
