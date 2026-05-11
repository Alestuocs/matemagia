import { useState, useEffect, useRef, useCallback } from 'react'
import TopBar from '../components/layout/TopBar'
import { useProgress } from '../contexts/ProgressContext'

// ─── Game 1: Carrera de Números ────────────────
function NumberRace({ onExit }) {
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(60)
  const [question, setQuestion] = useState(null)
  const [inputVal, setInputVal] = useState('')
  const [feedback, setFeedback] = useState(null) // 'correct'|'wrong'
  const [started, setStarted] = useState(false)
  const [finished, setFinished] = useState(false)
  const inputRef = useRef()
  const { saveAttempt } = useProgress()

  function generateQ() {
    const ops = ['+', '-', '×']
    const op = ops[Math.floor(Math.random() * ops.length)]
    let a, b, answer
    if (op === '+') { a = Math.floor(Math.random() * 20) + 1; b = Math.floor(Math.random() * 20) + 1; answer = a + b }
    if (op === '-') { a = Math.floor(Math.random() * 20) + 10; b = Math.floor(Math.random() * a); answer = a - b }
    if (op === '×') { a = Math.floor(Math.random() * 9) + 1; b = Math.floor(Math.random() * 9) + 1; answer = a * b }
    return { text: `${a} ${op} ${b} = ?`, answer }
  }

  function start() {
    setStarted(true)
    setQuestion(generateQ())
    inputRef.current?.focus()
  }

  useEffect(() => {
    if (!started || finished) return
    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timer); setFinished(true); return 0 }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [started, finished])

  function handleSubmit(e) {
    e.preventDefault()
    if (!question || finished) return
    const correct = parseInt(inputVal) === question.answer
    saveAttempt('game-race', correct, correct ? 5 : 0)
    setFeedback(correct ? 'correct' : 'wrong')
    if (correct) setScore(s => s + 1)
    setInputVal('')
    setTimeout(() => {
      setFeedback(null)
      setQuestion(generateQ())
      inputRef.current?.focus()
    }, 500)
  }

  if (!started) {
    return (
      <div className="text-center space-y-4 p-4">
        <div className="text-6xl">🏎️</div>
        <h2 className="text-2xl font-black">Carrera de Números</h2>
        <p className="text-gray-600 font-semibold">Responde operaciones en 60 segundos</p>
        <button onClick={start} className="btn-primary w-full text-lg">¡Arrancar! 🚀</button>
        <button onClick={onExit} className="btn-ghost w-full">Volver</button>
      </div>
    )
  }

  if (finished) {
    return (
      <div className="text-center space-y-4 p-4">
        <div className="text-6xl">🏁</div>
        <h2 className="text-2xl font-black">¡Tiempo!</h2>
        <div className="text-5xl font-black text-magic-600">{score}</div>
        <p className="text-gray-500 font-semibold">respuestas correctas</p>
        <p className="text-sm text-gray-400">{score >= 20 ? '¡Increíble! 🌟' : score >= 10 ? '¡Muy bien! 💪' : '¡Sigue practicando! 📚'}</p>
        <button onClick={() => { setScore(0); setTimeLeft(60); setFinished(false); setStarted(false) }} className="btn-primary w-full">Jugar de nuevo</button>
        <button onClick={onExit} className="btn-ghost w-full">Volver</button>
      </div>
    )
  }

  const timerColor = timeLeft > 20 ? 'text-green-500' : timeLeft > 10 ? 'text-yellow-500' : 'text-red-500'

  return (
    <div className="space-y-4 p-4">
      <div className="flex justify-between items-center">
        <div className="font-black text-xl">⭐ {score}</div>
        <div className={`font-black text-2xl ${timerColor}`}>⏱ {timeLeft}s</div>
      </div>
      <div className={`card border-2 text-center text-3xl font-black py-8 transition-all ${
        feedback === 'correct' ? 'border-green-400 bg-green-50' :
        feedback === 'wrong' ? 'border-red-400 bg-red-50 animate-shake' :
        'border-magic-200'
      }`}>
        {feedback === 'correct' ? '✅' : feedback === 'wrong' ? '❌' : question?.text}
      </div>
      <form onSubmit={handleSubmit}>
        <input
          ref={inputRef}
          type="number"
          value={inputVal}
          onChange={e => setInputVal(e.target.value)}
          className="w-full text-3xl font-black text-center border-2 border-magic-300 rounded-2xl p-4 focus:outline-none focus:border-magic-500"
          placeholder="?"
          autoComplete="off"
        />
        <button type="submit" className="btn-primary w-full mt-3 text-lg">Confirmar ✓</button>
      </form>
    </div>
  )
}

// ─── Game 2: Verdadero o Falso ─────────────────
function TrueFalse({ onExit }) {
  const TOTAL = 10
  const [qIndex, setQIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)
  const [feedback, setFeedback] = useState(null)
  const [started, setStarted] = useState(false)
  const { saveAttempt } = useProgress()

  function generateStatement() {
    const a = Math.floor(Math.random() * 20) + 1
    const b = Math.floor(Math.random() * 20) + 1
    const ops = ['+', '-', '×']
    const op = ops[Math.floor(Math.random() * ops.length)]
    let real
    if (op === '+') real = a + b
    if (op === '-') real = Math.abs(a - b)
    if (op === '×') real = (a % 10) * (b % 10)
    const showWrong = Math.random() > 0.5
    const shown = showWrong ? real + Math.floor(Math.random() * 5) + 1 : real
    return {
      text: `${op === '-' ? Math.max(a, b) : a} ${op} ${op === '-' ? Math.min(a, b) : b} = ${shown}`,
      isTrue: !showWrong || shown === real,
    }
  }

  const [questions] = useState(() => Array.from({ length: TOTAL }, generateStatement))

  function handleAnswer(answer) {
    if (feedback) return
    const q = questions[qIndex]
    const correct = (answer === 'verdadero') === q.isTrue
    saveAttempt('game-tf', correct, correct ? 5 : 0)
    setFeedback(correct ? 'correct' : 'wrong')
    if (correct) setScore(s => s + 1)
    setTimeout(() => {
      setFeedback(null)
      if (qIndex + 1 < TOTAL) setQIndex(i => i + 1)
      else setFinished(true)
    }, 800)
  }

  if (!started) {
    return (
      <div className="text-center space-y-4 p-4">
        <div className="text-6xl">✅</div>
        <h2 className="text-2xl font-black">¿Verdadero o Falso?</h2>
        <p className="text-gray-600 font-semibold">{TOTAL} preguntas, ¿cuántas acertarás?</p>
        <button onClick={() => setStarted(true)} className="btn-primary w-full text-lg">¡Empezar! ▶</button>
        <button onClick={onExit} className="btn-ghost w-full">Volver</button>
      </div>
    )
  }

  if (finished) {
    return (
      <div className="text-center space-y-4 p-4">
        <div className="text-6xl">{score >= 8 ? '🌟' : score >= 5 ? '😊' : '💪'}</div>
        <h2 className="text-2xl font-black">{score}/{TOTAL} correctas</h2>
        <p className="text-gray-500 font-semibold">{score >= 8 ? '¡Excelente!' : score >= 5 ? '¡Muy bien!' : '¡Sigue practicando!'}</p>
        <button onClick={() => { setQIndex(0); setScore(0); setFinished(false); setStarted(false) }} className="btn-primary w-full">Jugar de nuevo</button>
        <button onClick={onExit} className="btn-ghost w-full">Volver</button>
      </div>
    )
  }

  const q = questions[qIndex]

  return (
    <div className="space-y-4 p-4">
      <div className="flex justify-between text-sm font-bold text-gray-500">
        <span>Pregunta {qIndex + 1}/{TOTAL}</span>
        <span>✅ {score}</span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full">
        <div className="h-full bg-magic-500 rounded-full transition-all" style={{ width: `${(qIndex / TOTAL) * 100}%` }} />
      </div>
      <div className={`card border-2 text-center text-2xl font-black py-8 transition-all ${
        feedback === 'correct' ? 'border-green-400 bg-green-50' :
        feedback === 'wrong' ? 'border-red-400 bg-red-50 animate-shake' :
        'border-magic-200'
      }`}>
        {feedback ? (feedback === 'correct' ? '✅ ¡Correcto!' : '❌ ¡Incorrecto!') : q.text}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <button onClick={() => handleAnswer('verdadero')} disabled={!!feedback}
          className="option-btn text-center py-8 border-green-300 hover:bg-green-50">
          <div className="text-4xl">✅</div>
          <div className="font-black mt-1">Verdadero</div>
        </button>
        <button onClick={() => handleAnswer('falso')} disabled={!!feedback}
          className="option-btn text-center py-8 border-red-300 hover:bg-red-50">
          <div className="text-4xl">❌</div>
          <div className="font-black mt-1">Falso</div>
        </button>
      </div>
    </div>
  )
}

// ─── Game 3: Ordena los Números ────────────────
function SortNumbers({ onExit }) {
  const [started, setStarted] = useState(false)
  const [numbers, setNumbers] = useState([])
  const [order, setOrder] = useState([])
  const [selected, setSelected] = useState(null)
  const [finished, setFinished] = useState(false)
  const [score, setScore] = useState(0)
  const [round, setRound] = useState(0)
  const [ascending, setAscending] = useState(true)
  const { saveAttempt } = useProgress()
  const ROUNDS = 5

  function newRound() {
    const nums = Array.from({ length: 5 }, () => Math.floor(Math.random() * 100) + 1)
    const shuffled = [...nums].sort(() => Math.random() - 0.5)
    const asc = Math.random() > 0.5
    setNumbers(shuffled)
    setOrder([])
    setSelected(null)
    setAscending(asc)
  }

  function start() {
    setStarted(true)
    setRound(1)
    setScore(0)
    newRound()
  }

  function tap(num) {
    if (order.includes(num)) return
    const newOrder = [...order, num]
    setOrder(newOrder)
    if (newOrder.length === 5) {
      // Check
      const sorted = [...numbers].sort((a, b) => ascending ? a - b : b - a)
      const correct = newOrder.every((n, i) => n === sorted[i])
      saveAttempt('game-sort', correct, correct ? 10 : 0)
      if (correct) setScore(s => s + 1)
      setTimeout(() => {
        if (round < ROUNDS) {
          setRound(r => r + 1)
          newRound()
        } else {
          setFinished(true)
        }
      }, 1000)
    }
  }

  if (!started) {
    return (
      <div className="text-center space-y-4 p-4">
        <div className="text-6xl">🔢</div>
        <h2 className="text-2xl font-black">Ordena los Números</h2>
        <p className="text-gray-600 font-semibold">Toca los números en el orden correcto</p>
        <button onClick={start} className="btn-primary w-full text-lg">¡Ordenar! 📊</button>
        <button onClick={onExit} className="btn-ghost w-full">Volver</button>
      </div>
    )
  }

  if (finished) {
    return (
      <div className="text-center space-y-4 p-4">
        <div className="text-6xl">{score >= 4 ? '🌟' : score >= 2 ? '😊' : '💪'}</div>
        <h2 className="text-2xl font-black">{score}/{ROUNDS} rondas correctas</h2>
        <button onClick={() => { setFinished(false); setStarted(false) }} className="btn-primary w-full">Jugar de nuevo</button>
        <button onClick={onExit} className="btn-ghost w-full">Volver</button>
      </div>
    )
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex justify-between text-sm font-bold text-gray-500">
        <span>Ronda {round}/{ROUNDS}</span>
        <span>⭐ {score}</span>
      </div>
      <div className="card text-center border-magic-200">
        <p className="font-black text-magic-700 text-lg">
          {ascending ? '⬆️ De menor a mayor' : '⬇️ De mayor a menor'}
        </p>
        <div className="flex gap-2 justify-center mt-3 flex-wrap">
          {order.map((n, i) => (
            <span key={i} className="w-12 h-12 bg-magic-500 text-white rounded-xl font-black text-lg flex items-center justify-center">
              {n}
            </span>
          ))}
          {Array.from({ length: 5 - order.length }).map((_, i) => (
            <span key={i} className="w-12 h-12 bg-gray-100 rounded-xl border-2 border-dashed border-gray-300" />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-5 gap-2">
        {numbers.map((n, i) => (
          <button
            key={i}
            onClick={() => tap(n)}
            disabled={order.includes(n)}
            className={`h-14 rounded-2xl font-black text-xl transition-all active:scale-90 ${
              order.includes(n)
                ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                : 'bg-white border-2 border-magic-300 text-magic-700 hover:bg-magic-50'
            }`}
          >
            {n}
          </button>
        ))}
      </div>
      <button onClick={() => { setOrder([]); }} className="text-sm text-gray-400 hover:text-magic-500 font-semibold w-full text-center">
        🔄 Reiniciar selección
      </button>
    </div>
  )
}

// ─── Game 4: Fracciones Visuales ───────────────
function FraccionesVisuales({ onExit }) {
  const TOTAL = 10
  const TIME_LIMIT = 60
  const [started, setStarted] = useState(false)
  const [qIndex, setQIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)
  const [feedback, setFeedback] = useState(null)
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT)
  const { saveAttempt } = useProgress()

  function generateQuestion() {
    const n = Math.floor(Math.random() * 4) + 2 // 2-5 total slices
    const m = Math.floor(Math.random() * (n - 1)) + 1 // 1 to n-1 shaded
    return { n, m, fraction: `${m}/${n}` }
  }

  const [questions] = useState(() => Array.from({ length: TOTAL }, generateQuestion))
  const q = questions[qIndex] || questions[0]

  function makeOpts(frac, n, m) {
    const opts = new Set([frac])
    while (opts.size < 4) {
      const wrongN = Math.floor(Math.random() * (n - 1)) + 1
      if (wrongN !== m) opts.add(`${wrongN}/${n}`)
      if (opts.size < 4) {
        const wrongD = Math.floor(Math.random() * 4) + 2
        if (wrongD !== n) opts.add(`${m}/${wrongD}`)
      }
    }
    return [...opts].slice(0, 4).sort(() => Math.random() - 0.5)
  }

  useEffect(() => {
    if (!started || finished) return
    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timer); setFinished(true); return 0 }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [started, finished])

  function handleAnswer(opt) {
    if (feedback) return
    const correct = opt === q.fraction
    saveAttempt('game-fracciones', correct, correct ? 8 : 0)
    setFeedback(correct ? 'correct' : 'wrong')
    if (correct) setScore(s => s + 1)
    setTimeout(() => {
      setFeedback(null)
      if (qIndex + 1 < TOTAL) setQIndex(i => i + 1)
      else setFinished(true)
    }, 800)
  }

  if (!started) {
    return (
      <div className="text-center space-y-4 p-4">
        <div className="text-6xl">🍰</div>
        <h2 className="text-2xl font-black">Fracciones Visuales</h2>
        <p className="text-gray-600 font-semibold">Identifica la fracción del pastel — {TOTAL} preguntas en {TIME_LIMIT}s</p>
        <button onClick={() => setStarted(true)} className="btn-primary w-full text-lg">¡Empezar! 🍕</button>
        <button onClick={onExit} className="btn-ghost w-full">Volver</button>
      </div>
    )
  }

  if (finished) {
    return (
      <div className="text-center space-y-4 p-4">
        <div className="text-6xl">{score >= 8 ? '🌟' : score >= 5 ? '😊' : '💪'}</div>
        <h2 className="text-2xl font-black">{score}/{TOTAL} correctas</h2>
        <p className="text-gray-500 font-semibold">{score >= 8 ? '¡Experto en fracciones! 🎉' : score >= 5 ? '¡Muy bien!' : '¡Sigue practicando!'}</p>
        <button onClick={() => { setQIndex(0); setScore(0); setFinished(false); setStarted(false); setTimeLeft(TIME_LIMIT) }} className="btn-primary w-full">Jugar de nuevo</button>
        <button onClick={onExit} className="btn-ghost w-full">Volver</button>
      </div>
    )
  }

  const opts = makeOpts(q.fraction, q.n, q.m)
  const timerColor = timeLeft > 20 ? 'text-green-500' : timeLeft > 10 ? 'text-yellow-500' : 'text-red-500'

  // Draw pie-like visual using divs
  const slices = Array.from({ length: q.n }, (_, i) => i < q.m)

  return (
    <div className="space-y-4 p-4">
      <div className="flex justify-between items-center">
        <div className="font-black text-xl">⭐ {score}/{TOTAL}</div>
        <div className={`font-black text-xl ${timerColor}`}>⏱ {timeLeft}s</div>
      </div>
      <div className={`card border-2 text-center py-6 transition-all ${
        feedback === 'correct' ? 'border-green-400 bg-green-50' :
        feedback === 'wrong' ? 'border-red-400 bg-red-50' : 'border-magic-200'
      }`}>
        <p className="font-bold text-gray-600 mb-3">¿Qué fracción está sombreada?</p>
        {/* Visual fraction representation */}
        <div className="flex gap-2 justify-center flex-wrap mb-2">
          {slices.map((shaded, i) => (
            <div
              key={i}
              className={`w-10 h-10 rounded-lg border-2 ${shaded ? 'bg-magic-500 border-magic-600' : 'bg-gray-100 border-gray-300'}`}
            />
          ))}
        </div>
        <p className="text-sm text-gray-400 font-semibold">{q.m} de {q.n} partes sombreadas</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {opts.map((opt, i) => (
          <button
            key={i}
            onClick={() => handleAnswer(opt)}
            disabled={!!feedback}
            className={`option-btn text-center text-2xl font-black py-5 ${
              feedback && opt === q.fraction ? 'option-btn-correct' :
              feedback === 'wrong' ? 'opacity-50' : ''
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Game 5: Ecuación Resuelta ─────────────────
function EcuacionResuelta({ onExit }) {
  const TOTAL = 10
  const [started, setStarted] = useState(false)
  const [qIndex, setQIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)
  const [inputVal, setInputVal] = useState('')
  const [feedback, setFeedback] = useState(null) // 'correct' | 'wrong'
  const inputRef = useRef()
  const { saveAttempt } = useProgress()

  function generateEquation() {
    const x = Math.floor(Math.random() * 15) + 1
    const type = Math.floor(Math.random() * 3)
    if (type === 0) {
      const a = Math.floor(Math.random() * 15) + 1
      return { text: `x + ${a} = ${x + a}`, answer: x }
    } else if (type === 1) {
      const a = Math.floor(Math.random() * 10) + 1
      return { text: `x - ${a} = ${x}`, answer: x + a }
    } else {
      const a = Math.floor(Math.random() * 8) + 2
      return { text: `${a} × x = ${a * x}`, answer: x }
    }
  }

  const [questions] = useState(() => Array.from({ length: TOTAL }, generateEquation))
  const q = questions[qIndex] || questions[0]

  function handleSubmit(e) {
    e.preventDefault()
    if (feedback || !inputVal.trim()) return
    const userAns = parseInt(inputVal)
    const correct = userAns === q.answer
    saveAttempt('game-ecuacion', correct, correct ? 10 : 0)
    setFeedback(correct ? 'correct' : 'wrong')
    if (correct) setScore(s => s + 1)
    setTimeout(() => {
      setFeedback(null)
      setInputVal('')
      if (qIndex + 1 < TOTAL) setQIndex(i => i + 1)
      else setFinished(true)
      inputRef.current?.focus()
    }, 1200)
  }

  if (!started) {
    return (
      <div className="text-center space-y-4 p-4">
        <div className="text-6xl">⚖️</div>
        <h2 className="text-2xl font-black">Ecuación Resuelta</h2>
        <p className="text-gray-600 font-semibold">Encuentra el valor de x — {TOTAL} ecuaciones</p>
        <button onClick={() => { setStarted(true); setTimeout(() => inputRef.current?.focus(), 100) }} className="btn-primary w-full text-lg">¡Resolver! ✏️</button>
        <button onClick={onExit} className="btn-ghost w-full">Volver</button>
      </div>
    )
  }

  if (finished) {
    return (
      <div className="text-center space-y-4 p-4">
        <div className="text-6xl">{score >= 8 ? '🌟' : score >= 5 ? '😊' : '💪'}</div>
        <h2 className="text-2xl font-black">{score}/{TOTAL} correctas</h2>
        <p className="text-gray-500 font-semibold">{score >= 8 ? '¡Algebrista! 🎉' : score >= 5 ? '¡Bien!' : '¡Practica más!'}</p>
        <button onClick={() => { setQIndex(0); setScore(0); setFinished(false); setStarted(false); setInputVal('') }} className="btn-primary w-full">Jugar de nuevo</button>
        <button onClick={onExit} className="btn-ghost w-full">Volver</button>
      </div>
    )
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex justify-between text-sm font-bold text-gray-500">
        <span>Ecuación {qIndex + 1}/{TOTAL}</span>
        <span>✅ {score}</span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full">
        <div className="h-full bg-magic-500 rounded-full transition-all" style={{ width: `${(qIndex / TOTAL) * 100}%` }} />
      </div>
      <div className={`card border-2 text-center py-8 transition-all ${
        feedback === 'correct' ? 'border-green-400 bg-green-50' :
        feedback === 'wrong' ? 'border-red-400 bg-red-50 animate-shake' :
        'border-magic-200'
      }`}>
        {feedback ? (
          <div>
            <div className="text-3xl">{feedback === 'correct' ? '✅ ¡Correcto!' : `❌ Era ${q.answer}`}</div>
            {feedback === 'wrong' && <div className="text-gray-500 text-sm mt-1">{q.text.replace('x', q.answer.toString())} ✓</div>}
          </div>
        ) : (
          <div className="text-3xl font-black text-gray-800">⚖️ {q.text}</div>
        )}
      </div>
      <form onSubmit={handleSubmit}>
        <div className="text-center font-bold text-gray-500 mb-2">x = ?</div>
        <input
          ref={inputRef}
          type="number"
          value={inputVal}
          onChange={e => setInputVal(e.target.value)}
          className="w-full text-3xl font-black text-center border-2 border-magic-300 rounded-2xl p-4 focus:outline-none focus:border-magic-500"
          placeholder="?"
          autoComplete="off"
          disabled={!!feedback}
        />
        <button type="submit" className="btn-primary w-full mt-3 text-lg" disabled={!!feedback || !inputVal.trim()}>
          Confirmar ✓
        </button>
      </form>
    </div>
  )
}

// ─── Hub ───────────────────────────────────────
export default function GamesHub() {
  const [activeGame, setActiveGame] = useState(null)

  const GAMES = [
    { id: 'race', title: 'Carrera de Números', icon: '🏎️', desc: '¡Responde operaciones lo más rápido que puedas en 60 segundos!', color: 'from-red-400 to-orange-400' },
    { id: 'tf', title: '¿Verdadero o Falso?', icon: '✅', desc: '¿Es correcta la operación? ¡10 preguntas a toda velocidad!', color: 'from-green-400 to-teal-400' },
    { id: 'sort', title: 'Ordena los Números', icon: '🔢', desc: 'Ordena 5 números de menor a mayor o al revés', color: 'from-blue-400 to-indigo-400' },
    { id: 'fracciones', title: 'Fracciones Visuales', icon: '🍰', desc: 'Identifica la fracción de un pastel dividido en partes — 10 preguntas, 60 segundos', color: 'from-pink-400 to-rose-400' },
    { id: 'ecuacion', title: 'Ecuación Resuelta', icon: '⚖️', desc: 'Encuentra el valor de x en ecuaciones simples — 10 ecuaciones', color: 'from-violet-400 to-purple-400' },
  ]

  function renderGame() {
    if (activeGame === 'race') return <NumberRace onExit={() => setActiveGame(null)} />
    if (activeGame === 'tf') return <TrueFalse onExit={() => setActiveGame(null)} />
    if (activeGame === 'sort') return <SortNumbers onExit={() => setActiveGame(null)} />
    if (activeGame === 'fracciones') return <FraccionesVisuales onExit={() => setActiveGame(null)} />
    if (activeGame === 'ecuacion') return <EcuacionResuelta onExit={() => setActiveGame(null)} />
  }

  return (
    <div className="pb-24">
      <TopBar title="Juegos 🎮" showBack={false} showXP />
      <div className="page-shell mt-4">
        {activeGame ? (
          <div className="card border-2 border-magic-200">
            {renderGame()}
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-center text-gray-500 font-semibold">¡Practica jugando!</p>
            {GAMES.map(g => (
              <button
                key={g.id}
                onClick={() => setActiveGame(g.id)}
                className="w-full card flex items-center gap-4 text-left active:scale-95 transition-all border-2 border-gray-100 hover:border-magic-300"
              >
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${g.color} flex items-center justify-center text-3xl flex-shrink-0`}>
                  {g.icon}
                </div>
                <div>
                  <div className="font-black text-gray-800">{g.title}</div>
                  <div className="text-sm text-gray-500 font-semibold">{g.desc}</div>
                </div>
                <span className="ml-auto text-gray-400">→</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
