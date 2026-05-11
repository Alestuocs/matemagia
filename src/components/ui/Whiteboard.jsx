import { useEffect, useRef, useState } from 'react'

// Small finger-drawing canvas the student can use as a scratchpad while
// solving an exercise. Works with touch + mouse, has pen / eraser / clear,
// and is resilient to mobile pointer events.
export default function Whiteboard({ height = 220 }) {
  const canvasRef = useRef(null)
  const ctxRef = useRef(null)
  const drawingRef = useRef(false)
  const lastRef = useRef({ x: 0, y: 0 })
  const [tool, setTool] = useState('pen')   // 'pen' | 'eraser'
  const [color, setColor] = useState('#6d28d9')

  // (Re)size the canvas to its container, accounting for device pixel ratio.
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = window.devicePixelRatio || 1
    const resize = () => {
      const { width } = canvas.getBoundingClientRect()
      canvas.width = width * dpr
      canvas.height = height * dpr
      const ctx = canvas.getContext('2d')
      ctx.scale(dpr, dpr)
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctxRef.current = ctx
    }
    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [height])

  function pointFromEvent(e) {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const touch = e.touches?.[0] ?? e.changedTouches?.[0]
    const cx = touch ? touch.clientX : e.clientX
    const cy = touch ? touch.clientY : e.clientY
    return { x: cx - rect.left, y: cy - rect.top }
  }

  function start(e) {
    e.preventDefault()
    drawingRef.current = true
    lastRef.current = pointFromEvent(e)
  }

  function move(e) {
    if (!drawingRef.current) return
    e.preventDefault()
    const ctx = ctxRef.current
    if (!ctx) return
    const pt = pointFromEvent(e)
    ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color
    ctx.lineWidth = tool === 'eraser' ? 20 : 3
    ctx.beginPath()
    ctx.moveTo(lastRef.current.x, lastRef.current.y)
    ctx.lineTo(pt.x, pt.y)
    ctx.stroke()
    lastRef.current = pt
  }

  function end() {
    drawingRef.current = false
  }

  function clear() {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.save()
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.restore()
  }

  const colors = ['#6d28d9', '#dc2626', '#059669', '#1e40af', '#111827']

  return (
    <div className="rounded-2xl border-2 border-magic-200 bg-white overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 bg-magic-50 border-b border-magic-100 text-xs font-bold text-magic-700">
        <span>📝 Pizarra</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setTool('pen')}
            className={`px-2 py-1 rounded-lg ${tool === 'pen' ? 'bg-magic-500 text-white' : 'bg-white text-gray-600'}`}
          >✏️ Lápiz</button>
          <button
            type="button"
            onClick={() => setTool('eraser')}
            className={`px-2 py-1 rounded-lg ${tool === 'eraser' ? 'bg-magic-500 text-white' : 'bg-white text-gray-600'}`}
          >🧽 Borrar</button>
          <button
            type="button"
            onClick={clear}
            className="px-2 py-1 rounded-lg bg-white text-red-500 border border-red-200"
          >🗑️ Limpiar</button>
        </div>
      </div>

      {tool === 'pen' && (
        <div className="flex gap-2 px-3 py-1 bg-white border-b border-magic-100">
          {colors.map(c => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              aria-label={`Color ${c}`}
              className={`w-6 h-6 rounded-full border-2 ${color === c ? 'border-magic-700 scale-110' : 'border-gray-200'}`}
              style={{ background: c }}
            />
          ))}
        </div>
      )}

      <canvas
        ref={canvasRef}
        style={{ height, touchAction: 'none', display: 'block', width: '100%' }}
        onMouseDown={start}
        onMouseMove={move}
        onMouseUp={end}
        onMouseLeave={end}
        onTouchStart={start}
        onTouchMove={move}
        onTouchEnd={end}
      />
    </div>
  )
}
