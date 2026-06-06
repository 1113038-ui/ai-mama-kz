import { NavLink } from 'react-router-dom'

const navItems = [
  { to: '/dashboard', icon: '🏠', label: 'Дашборд' },
  { to: '/medcard', icon: '📋', label: 'Карта' },
  { to: '/tracker', icon: '💊', label: 'Лекарства' },
  { to: '/benefits', icon: '💰', label: 'Выплаты' },
]

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-pb">
      <div className="flex max-w-lg mx-auto">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center py-2 text-xs font-medium transition-colors ${
                isActive ? 'text-primary-500' : 'text-gray-400 hover:text-gray-600'
              }`
            }
          >
            <span className="text-xl mb-0.5">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
