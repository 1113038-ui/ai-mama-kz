import { useState, useEffect } from 'react'
import { getMedications, setMedications, getMedLogs, setMedLogs } from '../utils/storage'
import BottomNav from '../components/BottomNav'

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">{title}</h3>
          <button onClick={onClose} className="text-2xl text-gray-400">×</button>
        </div>
        {children}
      </div>
    </div>
  )
}

function Heatmap({ logs }) {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDay = new Date(year, month, 1).getDay()

  const monthNames = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь']

  const dayStatus = (d) => {
    const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    const dayLog = logs[key]
    if (!dayLog) return d > now.getDate() ? 'future' : 'empty'
    const vals = Object.values(dayLog)
    if (vals.length === 0) return 'empty'
    const taken = vals.filter(Boolean).length
    const ratio = taken / vals.length
    if (ratio >= 1) return 'green'
    if (ratio >= 0.5) return 'yellow'
    return 'red'
  }

  const colors = { green: 'bg-green-400', yellow: 'bg-yellow-400', red: 'bg-red-400', empty: 'bg-gray-100', future: 'bg-gray-50' }

  return (
    <div>
      <h3 className="font-bold text-gray-800 mb-3">{monthNames[month]} {year}</h3>
      <div className="grid grid-cols-7 gap-1">
        {['Вс','Пн','Вт','Ср','Чт','Пт','Сб'].map(d => (
          <div key={d} className="text-center text-xs text-gray-400 py-1">{d}</div>
        ))}
        {Array(firstDay).fill(null).map((_, i) => <div key={`e${i}`} />)}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(d => {
          const s = dayStatus(d)
          return (
            <div key={d} className={`aspect-square rounded-lg flex items-center justify-center text-xs font-medium ${
              colors[s]} ${d === now.getDate() ? 'ring-2 ring-primary-400' : ''} ${s !== 'future' && s !== 'empty' ? 'text-white' : 'text-gray-500'}`}>
              {d}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function MedTracker() {
  const [meds, setMedsState] = useState(getMedications())
  const [logs, setLogsState] = useState(getMedLogs())
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ name: '', time: '08:00', duration: '30', startDate: new Date().toISOString().split('T')[0] })

  const today = new Date().toISOString().split('T')[0]
  const todayLogs = logs[today] || {}

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  const activeMeds = meds.filter(m => {
    const start = new Date(m.startDate || today)
    const end = new Date(start.getTime() + (parseInt(m.duration) || 30) * 24 * 60 * 60 * 1000)
    return new Date() >= start && new Date() <= end
  })

  const markTaken = (id) => {
    const newLogs = { ...logs, [today]: { ...(logs[today] || {}), [id]: true } }
    setMedLogs(newLogs)
    setLogsState(newLogs)
  }

  const takenCount = activeMeds.filter(m => todayLogs[m.id]).length
  const progress = activeMeds.length > 0 ? (takenCount / activeMeds.length) * 100 : 0

  // Streak
  const calcStreak = () => {
    let streak = 0
    const d = new Date()
    d.setDate(d.getDate() - 1) // start from yesterday
    for (let i = 0; i < 30; i++) {
      const key = d.toISOString().split('T')[0]
      const dayLog = logs[key]
      if (!dayLog || Object.values(dayLog).every(v => !v)) break
      streak++
      d.setDate(d.getDate() - 1)
    }
    return streak
  }

  const addMed = () => {
    if (!form.name.trim()) return
    const med = { ...form, id: Date.now() }
    const updated = [...meds, med]
    setMedications(updated)
    setMedsState(updated)
    setShowModal(false)
    setForm({ name: '', time: '08:00', duration: '30', startDate: new Date().toISOString().split('T')[0] })
  }

  const deleteMed = (id) => {
    const updated = meds.filter(m => m.id !== id)
    setMedications(updated)
    setMedsState(updated)
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-gradient-to-r from-primary-500 to-pink-400 text-white px-4 pt-12 pb-4">
        <div className="max-w-lg mx-auto">
          <h1 className="text-xl font-bold">Трекер лекарств</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-5">
        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="card text-center">
            <p className="text-2xl font-bold text-primary-500">{takenCount}/{activeMeds.length}</p>
            <p className="text-xs text-gray-400 mt-0.5">Сегодня</p>
          </div>
          <div className="card text-center">
            <p className="text-2xl font-bold text-orange-500">{calcStreak()}</p>
            <p className="text-xs text-gray-400 mt-0.5">Дней подряд</p>
          </div>
          <div className="card text-center">
            <p className="text-2xl font-bold text-green-500">{Math.round(progress)}%</p>
            <p className="text-xs text-gray-400 mt-0.5">Выполнено</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="card">
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium text-gray-700">Прогресс дня</span>
            <span className="text-primary-500 font-medium">{takenCount} из {activeMeds.length}</span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary-400 to-pink-400 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Today schedule */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-800">Расписание на сегодня</h2>
            <button onClick={() => setShowModal(true)} className="text-sm text-primary-500 font-medium">+ Добавить</button>
          </div>
          {activeMeds.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-6">Нет активных препаратов.<br />Добавьте первый!</p>
          ) : (
            <div className="space-y-2">
              {activeMeds.sort((a, b) => a.time.localeCompare(b.time)).map(med => {
                const taken = todayLogs[med.id]
                return (
                  <div key={med.id} className={`flex items-center gap-3 p-3 rounded-xl transition-all ${taken ? 'bg-green-50' : 'bg-gray-50'}`}>
                    <div className="text-center min-w-[42px]">
                      <p className="text-xs font-bold text-gray-500">{med.time}</p>
                    </div>
                    <span className="text-xl">{taken ? '✅' : '💊'}</span>
                    <div className="flex-1">
                      <p className="font-medium text-gray-800 text-sm">{med.name}</p>
                      <p className="text-xs text-gray-400">Курс: {med.duration} дней</p>
                    </div>
                    {!taken
                      ? <button onClick={() => markTaken(med.id)} className="bg-primary-500 text-white text-xs font-medium px-3 py-1.5 rounded-lg">Принято</button>
                      : <span className="text-xs text-green-600 font-medium">✓</span>
                    }
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Heatmap */}
        <div className="card">
          <Heatmap logs={logs} />
          <div className="flex gap-4 mt-3 text-xs text-gray-500">
            <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-400 rounded inline-block" /> Все принято</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 bg-yellow-400 rounded inline-block" /> Частично</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-400 rounded inline-block" /> Пропущено</span>
          </div>
        </div>

        {/* All medications */}
        {meds.length > 0 && (
          <div className="card">
            <h2 className="font-bold text-gray-800 mb-3">Все препараты</h2>
            <div className="space-y-2">
              {meds.map(m => (
                <div key={m.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <span className="text-xl">💊</span>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800 text-sm">{m.name}</p>
                    <p className="text-xs text-gray-400">{m.time} · {m.duration} дней с {m.startDate}</p>
                  </div>
                  <button onClick={() => deleteMed(m.id)} className="text-gray-300 hover:text-red-400 text-lg">×</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <Modal title="Добавить препарат" onClose={() => setShowModal(false)}>
          <div className="space-y-3">
            <div>
              <label className="label">Название препарата *</label>
              <input className="input-field" placeholder="Фолиевая кислота" value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label className="label">Время приёма</label>
              <input type="time" className="input-field" value={form.time}
                onChange={e => setForm(f => ({ ...f, time: e.target.value }))} />
            </div>
            <div>
              <label className="label">Курс (дней)</label>
              <input type="number" className="input-field" min={1} value={form.duration}
                onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} />
            </div>
            <div>
              <label className="label">Дата начала</label>
              <input type="date" className="input-field" value={form.startDate}
                onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} />
            </div>
            <button className="btn-primary w-full" onClick={addMed}>Сохранить</button>
          </div>
        </Modal>
      )}

      <BottomNav />
    </div>
  )
}
