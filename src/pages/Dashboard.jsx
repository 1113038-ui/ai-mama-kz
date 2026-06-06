import { useNavigate } from 'react-router-dom'
import { getUser, getMedications, getMedLogs, getBabyWeightByWeek } from '../utils/storage'
import BottomNav from '../components/BottomNav'

function ProgressRing({ week, total = 40 }) {
  const r = 52
  const circ = 2 * Math.PI * r
  const progress = Math.min(week / total, 1)
  const dash = circ * progress
  return (
    <div className="relative flex items-center justify-center" style={{ width: 140, height: 140 }}>
      <svg width={140} height={140} className="-rotate-90">
        <circle cx={70} cy={70} r={r} fill="none" stroke="#fce7f3" strokeWidth={12} />
        <circle cx={70} cy={70} r={r} fill="none" stroke="#e91e8c" strokeWidth={12}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
      </svg>
      <div className="absolute text-center">
        <div className="text-3xl font-bold text-primary-600">{week}</div>
        <div className="text-xs text-gray-400">из 40 нед.</div>
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
  const daysLeft = pdr ? Math.max(0, Math.round((pdr - Date.now()) / (24 * 60 * 60 * 1000))) : '—'
  const matLeaveStart = pdr ? new Date(pdr.getTime() - 70 * 24 * 60 * 60 * 1000) : null
  const daysToMatLeave = matLeaveStart ? Math.max(0, Math.round((matLeaveStart - Date.now()) / (24 * 60 * 60 * 1000))) : '—'
  const babyWeight = getBabyWeightByWeek(week)

  const today = new Date().toISOString().split('T')[0]
  const meds = getMedications()
  const logs = getMedLogs()
  const todayLogs = logs[today] || {}
  const todayMeds = meds.filter(m => {
    if (!m.startDate) return true
    const start = new Date(m.startDate)
    const end = new Date(start.getTime() + (m.duration || 30) * 24 * 60 * 60 * 1000)
    const now = new Date()
    return now >= start && now <= end
  })

  const upcomingEvents = [
    { date: pdr ? new Date(pdr.getTime() - 14 * 24 * 60 * 60 * 1000).toLocaleDateString('ru-RU') : '—', title: 'УЗИ (38 нед)', icon: '🔬' },
    { date: matLeaveStart ? matLeaveStart.toLocaleDateString('ru-RU') : '—', title: 'Начало декрета', icon: '📅' },
    { date: pdr ? pdr.toLocaleDateString('ru-RU') : '—', title: 'Предполагаемая дата родов', icon: '👶' },
  ]

  const firstName = user.fullName ? user.fullName.split(' ')[1] || user.fullName.split(' ')[0] : 'Мама'

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-500 to-pink-400 text-white px-4 pt-12 pb-6">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div>
            <p className="text-primary-100 text-sm">Привет, 👋</p>
            <h1 className="text-xl font-bold">{firstName}!</h1>
          </div>
          <div className="text-3xl">🤱 <span className="text-lg font-bold">AI Mama KZ</span></div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-5">
        {/* Progress Ring Card */}
        <div className="card flex items-center gap-6">
          <ProgressRing week={week} />
          <div>
            <p className="text-gray-500 text-sm">Срок беременности</p>
            <p className="text-2xl font-bold text-gray-800">{week} недел{week === 1 ? 'я' : week < 5 ? 'и' : 'ь'}</p>
            {pdr && <p className="text-sm text-primary-500 mt-1">ПДР: {pdr.toLocaleDateString('ru-RU')}</p>}
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Текущая неделя', value: `${week} нед.`, icon: '🗓️', color: 'bg-purple-50 text-purple-600' },
            { label: 'Дней до родов', value: daysLeft, icon: '👶', color: 'bg-pink-50 text-pink-600' },
            { label: 'Дней до декрета', value: daysToMatLeave, icon: '🏠', color: 'bg-orange-50 text-orange-600' },
            { label: 'Вес малыша', value: babyWeight, icon: '⚖️', color: 'bg-green-50 text-green-600' },
          ].map(m => (
            <div key={m.label} className="card">
              <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl mb-2 ${m.color}`}>
                <span className="text-xl">{m.icon}</span>
              </div>
              <p className="text-2xl font-bold text-gray-800">{m.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{m.label}</p>
            </div>
          ))}
        </div>

        {/* Today Medications */}
        <div className="card">
          <h2 className="font-bold text-gray-800 mb-3">Лекарства сегодня</h2>
          {todayMeds.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">Нет назначений на сегодня</p>
          ) : (
            <div className="space-y-2">
              {todayMeds.slice(0, 4).map(med => {
                const taken = todayLogs[med.id]
                return (
                  <div key={med.id} className={`flex items-center gap-3 p-3 rounded-xl ${taken ? 'bg-green-50' : 'bg-gray-50'}`}>
                    <span className="text-xl">{taken ? '✅' : '💊'}</span>
                    <div className="flex-1">
                      <p className="font-medium text-gray-800 text-sm">{med.name}</p>
                      <p className="text-xs text-gray-400">{med.time}</p>
                    </div>
                    {taken && <span className="text-xs text-green-600 font-medium">Принято</span>}
                  </div>
                )
              })}
              {todayMeds.length > 4 && (
                <button onClick={() => navigate('/tracker')} className="text-primary-500 text-sm font-medium">
                  Ещё {todayMeds.length - 4} препаратов →
                </button>
              )}
            </div>
          )}
        </div>

        {/* Upcoming Events */}
        <div className="card">
          <h2 className="font-bold text-gray-800 mb-3">Ближайшие события</h2>
          <div className="space-y-2">
            {upcomingEvents.map((ev, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-primary-50 rounded-xl">
                <span className="text-xl">{ev.icon}</span>
                <div>
                  <p className="font-medium text-gray-800 text-sm">{ev.title}</p>
                  <p className="text-xs text-primary-500">{ev.date}</p>
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
