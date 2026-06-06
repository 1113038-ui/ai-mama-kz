import { useNavigate } from 'react-router-dom'
import { getUser, getMedications, getMedLogs, getBabyWeightByWeek } from '../utils/storage'
import BottomNav from '../components/BottomNav'

function ProgressRing({ week, total = 40 }) {
  const r = 56
  const circ = 2 * Math.PI * r
  const progress = Math.min(week / total, 1)
  const dash = circ * progress
  return (
    <div className="relative flex items-center justify-center" style={{ width: 148, height: 148 }}>
      <svg width={148} height={148} className="-rotate-90">
        <circle cx={74} cy={74} r={r} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth={10} />
        <circle cx={74} cy={74} r={r} fill="none" stroke="white" strokeWidth={10}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
      </svg>
      <div className="absolute text-center">
        <div className="text-4xl font-black text-white leading-none">{week}</div>
        <div className="text-xs text-purple-200 font-semibold mt-0.5">из 40 нед.</div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const user = getUser()
  if (!user) { navigate('/onboarding'); return null }

  const week = user.weeks || 0
  const pdr = user.pdr ? new Date(user.pdr) : null
  const daysLeft = pdr ? Math.max(0, Math.round((pdr - Date.now()) / 864e5)) : '—'
  const matLeaveStart = pdr ? new Date(pdr.getTime() - 70 * 864e5) : null
  const daysToMatLeave = matLeaveStart ? Math.max(0, Math.round((matLeaveStart - Date.now()) / 864e5)) : '—'
  const babyWeight = getBabyWeightByWeek(week)

  const today = new Date().toISOString().split('T')[0]
  const meds = getMedications()
  const logs = getMedLogs()
  const todayLogs = logs[today] || {}
  const todayMeds = meds.filter(m => {
    const start = new Date(m.startDate || today)
    const end = new Date(start.getTime() + (m.duration || 30) * 864e5)
    const now = new Date()
    return now >= start && now <= end
  })

  const firstName = user.fullName
    ? (user.fullName.split(' ')[1] || user.fullName.split(' ')[0])
    : 'Мама'

  const metrics = [
    { label: 'Дней до родов', value: daysLeft, icon: '👶', grad: 'from-pink-500 to-rose-400' },
    { label: 'Дней до декрета', value: daysToMatLeave, icon: '🏠', grad: 'from-violet-500 to-purple-400' },
    { label: 'Вес малыша', value: babyWeight, icon: '⚖️', grad: 'from-fuchsia-500 to-pink-400' },
    { label: 'Текущая неделя', value: `${week} нед`, icon: '🗓️', grad: 'from-purple-500 to-violet-400' },
  ]

  const upcomingEvents = [
    { date: pdr ? new Date(pdr.getTime() - 14 * 864e5).toLocaleDateString('ru-RU') : '—', title: 'УЗИ (38 нед)', icon: '🔬' },
    { date: matLeaveStart ? matLeaveStart.toLocaleDateString('ru-RU') : '—', title: 'Начало декрета', icon: '📅' },
    { date: pdr ? pdr.toLocaleDateString('ru-RU') : '—', title: 'Предполагаемая дата родов', icon: '👶' },
  ]

  return (
    <div className="page-bg pb-28">
      {/* Header */}
      <div className="header-gradient px-5 pt-14 pb-8">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-purple-200 text-sm font-medium">Добро пожаловать 👋</p>
              <h1 className="text-2xl font-black text-white mt-0.5">{firstName}!</h1>
            </div>
            <div className="glass rounded-2xl px-3 py-2 text-center" style={{ background: 'rgba(255,255,255,0.15)' }}>
              <span className="text-xl">🌸</span>
              <p className="text-white text-[10px] font-bold mt-0.5">AI Mama KZ</p>
            </div>
          </div>

          {/* Progress ring + info */}
          <div className="flex items-center gap-6">
            <ProgressRing week={week} />
            <div>
              <p className="text-purple-200 text-sm font-medium">Срок беременности</p>
              <p className="text-3xl font-black text-white mt-1">
                {week} {week === 1 ? 'неделя' : week < 5 ? 'недели' : 'недель'}
              </p>
              {pdr && (
                <div className="mt-2 bg-white/15 rounded-xl px-3 py-1.5 inline-block">
                  <p className="text-white text-xs font-semibold">
                    ПДР: {pdr.toLocaleDateString('ru-RU')}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-5 -mt-4 space-y-4">
        {/* Metrics grid */}
        <div className="grid grid-cols-2 gap-3">
          {metrics.map(m => (
            <div key={m.label} className={`rounded-3xl p-4 bg-gradient-to-br ${m.grad}`}
              style={{ boxShadow: '0 8px 24px -4px rgba(124,58,237,0.3)' }}>
              <span className="text-2xl">{m.icon}</span>
              <p className="text-2xl font-black text-white mt-2 leading-none">{m.value}</p>
              <p className="text-white/70 text-xs font-semibold mt-1">{m.label}</p>
            </div>
          ))}
        </div>

        {/* Today medications */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-black text-gray-900 text-lg">Лекарства сегодня</h2>
            <button onClick={() => navigate('/tracker')}
              className="text-xs font-bold text-primary-600 bg-primary-50 px-3 py-1.5 rounded-xl">
              Все →
            </button>
          </div>
          {todayMeds.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-3xl mb-2">💊</p>
              <p className="text-gray-400 text-sm font-medium">Нет назначений на сегодня</p>
              <button onClick={() => navigate('/tracker')}
                className="mt-3 text-primary-600 text-sm font-bold">
                + Добавить препарат
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {todayMeds.slice(0, 4).map(med => {
                const taken = todayLogs[med.id]
                return (
                  <div key={med.id} className={`flex items-center gap-3 p-3 rounded-2xl transition-all ${
                    taken ? 'bg-green-50' : 'bg-primary-50'
                  }`}>
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg ${
                      taken ? 'bg-green-100' : 'bg-white'
                    }`}>{taken ? '✅' : '💊'}</div>
                    <div className="flex-1">
                      <p className="font-bold text-gray-800 text-sm">{med.name}</p>
                      <p className="text-xs text-gray-400">{med.time}</p>
                    </div>
                    {taken
                      ? <span className="text-xs text-green-600 font-bold bg-green-100 px-2 py-1 rounded-lg">Принято</span>
                      : <span className="text-xs text-primary-500 font-bold bg-white px-2 py-1 rounded-lg">Ожидает</span>
                    }
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Upcoming events */}
        <div className="card">
          <h2 className="font-black text-gray-900 text-lg mb-4">Ближайшие события</h2>
          <div className="space-y-2">
            {upcomingEvents.map((ev, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-2xl"
                style={{ background: 'linear-gradient(135deg, #f5f3ff 0%, #fce7f3 100%)', border: '1px solid rgba(196,181,253,0.3)' }}>
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-xl shadow-sm">
                  {ev.icon}
                </div>
                <div>
                  <p className="font-bold text-gray-800 text-sm">{ev.title}</p>
                  <p className="text-xs text-primary-500 font-semibold">{ev.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
