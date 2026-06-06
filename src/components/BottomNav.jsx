import { useNavigate, useLocation } from 'react-router-dom'

const tabs = [
  { path: '/dashboard', icon: '🏠', label: 'Главная' },
  { path: '/medcard',   icon: '📋', label: 'Карта' },
  { path: '/tracker',   icon: '💊', label: 'Лекарства' },
  { path: '/benefits',  icon: '💰', label: 'Выплаты' },
]

export default function BottomNav() {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 px-4 pb-5">
      <div className="glass rounded-3xl max-w-lg mx-auto px-3 py-2.5 flex items-center justify-around"
        style={{ boxShadow: '0 8px 40px -8px rgba(124, 58, 237, 0.3)' }}>
        {tabs.map(t => {
          const active = pathname === t.path
          return (
            <button key={t.path} onClick={() => navigate(t.path)}
              className={`nav-item ${active ? 'active' : ''}`}>
              <span className="text-xl leading-none">{t.icon}</span>
              <span className={`text-[10px] font-bold mt-0.5 ${active ? 'text-white' : 'text-primary-400'}`}>
                {t.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
