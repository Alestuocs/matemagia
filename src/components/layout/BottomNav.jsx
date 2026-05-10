import { NavLink, useLocation } from 'react-router-dom'

const NAV_ITEMS = [
  { to: '/', icon: '🏠', label: 'Inicio' },
  { to: '/map', icon: '🗺️', label: 'Mapa' },
  { to: '/games', icon: '🎮', label: 'Juegos' },
  { to: '/achievements', icon: '🏆', label: 'Logros' },
  { to: '/profile', icon: '👤', label: 'Perfil' },
]

export default function BottomNav() {
  const location = useLocation()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-bottom z-40">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {NAV_ITEMS.map(({ to, icon, label }) => {
          const isActive = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to)
          return (
            <NavLink
              key={to}
              to={to}
              className={`flex flex-col items-center py-2 px-3 min-w-0 transition-all duration-150 ${
                isActive ? 'text-magic-600' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <span className={`text-2xl ${isActive ? 'animate-pop' : ''}`}>{icon}</span>
              <span className={`text-xs font-bold mt-0.5 ${isActive ? 'text-magic-600' : ''}`}>{label}</span>
              {isActive && <div className="w-1 h-1 bg-magic-500 rounded-full mt-0.5" />}
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
