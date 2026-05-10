import { useNavigate } from 'react-router-dom'
import { useProgress } from '../../contexts/ProgressContext'
import XPBar from '../ui/XPBar'

export default function TopBar({ title, showBack = true, showXP = false }) {
  const navigate = useNavigate()
  const { progress } = useProgress()

  return (
    <div className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-gray-100 safe-top">
      <div className="flex items-center gap-3 px-4 py-3 max-w-lg mx-auto">
        {showBack && (
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center active:scale-90 transition-transform"
          >
            ←
          </button>
        )}
        <h1 className="flex-1 font-black text-lg text-gray-800 truncate">{title}</h1>
        {showXP && (
          <div className="flex items-center gap-1 bg-magic-50 px-2 py-1 rounded-full">
            <span className="text-xs font-bold text-magic-600">⭐ {progress.xp}</span>
          </div>
        )}
      </div>
      {showXP && (
        <div className="px-4 pb-2 max-w-lg mx-auto">
          <XPBar xp={progress.xp} compact />
        </div>
      )}
    </div>
  )
}
