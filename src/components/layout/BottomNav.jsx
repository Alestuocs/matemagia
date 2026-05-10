import { useNavigate, useLocation } from 'react-router-dom'

const TABS = [
  { path: '/', icon: '🏠', label: 'Inicio' },
  { path: '/map', icon: '🗺️', label: 'Mapa' },
  { path: '/practice', icon: '⚡', label: 'Practicar' },
  { path: '/chat', icon: '🧙', label: 'Tutor' },
  { path: '/games', icon: '🎮', label: 'Juegos' },
]

export default function BottomNav() {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex z-50 shadow-lg">
      {TABS.map(tab => {
        const active = tab.path === '/'
          ? location.pathname === '/'
          : location.pathname.startsWith(tab.path)
        return (
          <button key={tab.path} onClick={() => navigate(tab.path)}
            className={`flex-1 flex flex-col items-center py-2 transition-all ${active ? 'text-magic-600' : 'text-gray-400'}`}>
            <span className={`text-xl transition-transform ${active ? 'scale-110' : ''}`}>{tab.icon}</span>
            <span className={`text-[10px] font-bold mt-0.5 ${active ? 'text-magic-600' : 'text-gray-400'}`}>{tab.label}</span>
            {active && <div className="w-1 h-1 bg-magic-500 rounded-full mt-0.5" />}
          </button>
        )
      })}
    </nav>
  )
}
