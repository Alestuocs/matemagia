import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProgress } from '../contexts/ProgressContext'
import { generateResponse, getWelcomeMessage } from '../lib/mathTutor'
import TopBar from '../components/layout/TopBar'

export default function MathChat() {
  const navigate = useNavigate()
  const { progress } = useProgress()
  const [messages, setMessages] = useState([
    { role: 'assistant', text: getWelcomeMessage(), id: 0 }
  ])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const endRef = useRef(null)

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  function sendMessage() {
    const text = input.trim()
    if (!text || typing) return
    setInput('')

    const userMsg = { role: 'user', text, id: Date.now() }
    setMessages(prev => [...prev, userMsg])
    setTyping(true)

    // Simulate typing delay
    setTimeout(() => {
      const { message } = generateResponse(text, progress.currentTopic)
      setMessages(prev => [...prev, { role: 'assistant', text: message, id: Date.now() + 1 }])
      setTyping(false)
    }, 800 + Math.random() * 400)
  }

  // Render message text with basic markdown (bold, newlines)
  function renderText(text) {
    return text.split('\n').map((line, i) => {
      const parts = line.split(/\*\*(.*?)\*\*/g)
      return (
        <p key={i} className={line === '' ? 'mt-2' : 'leading-relaxed'}>
          {parts.map((part, j) => j % 2 === 1 ? <strong key={j}>{part}</strong> : part)}
        </p>
      )
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex flex-col pb-20">
      <TopBar title="🧙‍♂️ Tutor MateMagia" onBack={() => navigate(-1)} />

      {/* Quick question chips */}
      <div className="px-4 pt-3 pb-2 flex gap-2 overflow-x-auto no-scrollbar">
        {['¿Cómo se resuelve x + 5 = 12?', '¿Qué es una fracción?', 'Ayuda con decimales', '¿Cómo calculo porcentajes?'].map(q => (
          <button key={q}
            onClick={() => { setInput(q) }}
            className="flex-shrink-0 bg-white border border-purple-200 text-purple-700 text-xs font-semibold px-3 py-2 rounded-full hover:bg-purple-50 transition-all">
            {q}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 px-4 py-2 space-y-3 overflow-y-auto">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white text-sm mr-2 flex-shrink-0 mt-1">🧙</div>
            )}
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
              msg.role === 'user'
                ? 'bg-purple-600 text-white rounded-br-sm'
                : 'bg-white shadow-sm border border-purple-100 text-gray-800 rounded-bl-sm'
            }`}>
              {msg.role === 'assistant' ? renderText(msg.text) : <p>{msg.text}</p>}
            </div>
          </div>
        ))}

        {typing && (
          <div className="flex justify-start">
            <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white text-sm mr-2">🧙</div>
            <div className="bg-white shadow-sm border border-purple-100 rounded-2xl px-4 py-3">
              <div className="flex gap-1">
                {[0, 1, 2].map(i => (
                  <div key={i} className="w-2 h-2 bg-purple-400 rounded-full"
                    style={{ animation: `bounce 1s ease-in-out ${i * 0.2}s infinite` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-gray-100 px-4 py-3">
        <div className="flex gap-2 max-w-lg mx-auto">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            placeholder="Escribe tu pregunta de matemáticas..."
            className="flex-1 bg-gray-100 rounded-2xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-300"
          />
          <button onClick={sendMessage} disabled={!input.trim() || typing}
            className="bg-purple-600 text-white rounded-2xl px-4 py-3 font-bold disabled:opacity-50 transition-all active:scale-95">
            ➤
          </button>
        </div>
      </div>
    </div>
  )
}
