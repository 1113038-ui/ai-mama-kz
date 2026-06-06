import { useState, useEffect } from 'react'
import { getMedications, setMedications, getMedLogs, setMedLogs } from '../utils/storage'
import BottomNav from '../components/BottomNav'

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: 'rgba(30,10,60,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}>
      <div className="bg-white rounded-t-3xl w-full max-w-lg p-6 pb-10 max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-xl font-black text-gray-900">{title}</h3>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold">×</button>
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
    const key = `${year}-${String(month + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
    const dayLog = logs[key]
    if (!dayLog || Object.keys(dayLog).length === 0) return d > now.getDate() ? 'future' : 'empty'
    const vals = Object.values(dayLog)
    const ratio = vals.filter(Boolean).length / vals.length
    return ratio >= 1 ? 'green' : ratio >= 0.5 ? 'yellow' : 'red'
  }

  const colors = {
    green: 'bg-green-400 text-white',
    yellow: 'bg-yellow-400 text-white',
    red: 'bg-red-400 text-white',
    empty: 'bg-primary-50 text-primary-300',
    future: 'bg-gray-50 text-gray-300'
  }

  return (
    <div>
      <h3 className="font-black text-gray-900 mb-4">{monthNames[month]} {year}</h3>
      <div className="grid grid-cols-7 gap-1.5">
        {['Вс','Пн','Вт','Ср','Чт','Пт','Сб'].map(d => (
          <div key={d} className="text-center text-[10px] font-bold text-primary-300 py-1">{d}</div>
        ))}
        {Array(firstDay).fill(null).map((_, i) => <div key={`e${i}`} />)}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(d => (
          <div key={d} className={`aspect-square rounded-xl flex items-center justify-center text-xs font-bold ${colors[dayStatus(d)]} ${
            d === now.getDate() ? 'ring-2 ring-primary-500' : ''
          }`}>{d}</div>
        ))}
      </div>
      <div className="flex gap-4 mt-4 text-xs text-gray-500">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-green-400 rounded-lg inline-block" />Все принято</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-yellow-400 rounded-lg inline-block" />Частично</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-red-400 rounded-lg inline-block" />Пропущено</span>
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
    if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission()
  }, [])

  const activeMeds = meds.filter(m => {
    const start = new Date(m.startDate || today)
    const end = new Date(start.getTime() + (parseInt(m.duration) || 30) * 864e5)
    const now = new Date()
    return now >= start && now <= end
  })

  const markTaken = (id) => {
    const newLogs = { ...logs, [today]: { ...(logs[today] || {}), [id]: true } }
    setMedLogs(newLogs); setLogsState(newLogs)
  }

  const takenCount = activeMeds.filter(m => todayLogs[m.id]).length
  const progress = activeMeds.length > 0 ? (takenCount / activeMeds.length) * 100 : 0

  const calcStreak = () => {
    let streak = 0
    const d = new Date(); d.setDate(d.getDate() - 1)
    for (let i = 0; i < 30; i++) {
      const key = d.toISOString().split('T')[0]
      const dl = logs[key]
      if (!dl || Object.values(dl).every(v => !v)) break
      streak++; d.setDate(d.getDate() - 1)
    }
    return streak
  }

  const addMed = () => {
    if (!form.name.trim()) return
    const updated = [...meds, { ...form, id: Date.now() }]
    setMedications(updated); setMedsState(updated)
    setShowModal(false)
    setForm({ name: '', time: '08:00', duration: '30', startDate: new Date().toISOString().split('T')[0] })
  }

  const deleteMed = (id) => {
    const updated = meds.filter(m => m.id !== id)
    setMedications(updated); setMedsState(updated)
  }

  return (
    <div className="page-bg pb-28">
      {/* Header */}
      <div className="header-gradient px-5 pt-14 pb-6">
        <div className="max-w-lg mx-auto">
          <h1 className="text-2xl font-black text-white">Трекер лекарств 💊</h1>
          <p className="text-purple-200 text-sm font-medium mt-1">Следите за приёмом препаратов</p>

          {/* Summary row */}
          <div className="flex gap-3 mt-5">
            {[
              { label: 'Сегодня', value: `${takenCount}/${activeMeds.length}`, color: 'text-white' },
              { label: 'Дней подряд', value: calcStreak(), color: 'text-yellow-300' },
              { label: 'Выполнено', value: `${Math.round(progress)}%`, color: 'text-green-300' },
            ].map(s => (
              <div key={s.label} className="flex-1 rounded-2xl py-3 text-center"
                style={{ background: 'rgba(255,255,255,0.15)' }}>
                <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
                <p className="text-white/60 text-[10px] font-bold mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-5 -mt-2 space-y-4">
        {/* Progress bar */}
        <div className="card">
          <div className="flex justify-between text-sm mb-3">
            <span className="font-bold text-gray-700">Прогресс дня</span>
            <span className="text-primary-600 font-bold">{takenCount} из {activeMeds.length}</span>
          </div>
          <div className="h-3 bg-primary-50 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #7c3aed, #ec4899)' }} />
          </div>
        </div>

        {/* Today schedule */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-black text-gray-900 text-lg">Расписание на сегодня</h2>
            <button onClick={() => setShowModal(true)}
              className="text-xs font-bold text-white px-3 py-2 rounded-xl"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #ec4899)' }}>
              + Добавить
            </button>
          </div>

          {activeMeds.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-4xl mb-3">💊</p>
              <p className="text-gray-400 font-medium">Нет активных препаратов</p>
              <p className="text-primary-400 text-sm mt-1">Нажмите + Добавить</p>
            </div>
          ) : (
            <div className="space-y-2">
              {activeMeds.sort((a, b) => a.time.localeCompare(b.time)).map(med => {
                const taken = todayLogs[med.id]
                return (
                  <div key={med.id} className={`flex items-center gap-3 p-3.5 rounded-2xl transition-all ${
                    taken ? 'bg-green-50' : 'bg-primary-50'
                  }`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${
                      taken ? 'bg-green-100' : 'bg-white'
                    }`}>{taken ? '✅' : '💊'}</div>
                    <div className="flex-1">
                      <p className="font-bold text-gray-800">{med.name}</p>
                      <p className="text-xs text-gray-400 font-medium">{med.time} · {med.duration} дней</p>
                    </div>
                    {!taken
                      ? <button onClick={() => markTaken(med.id)}
                          className="text-white text-xs font-bold px-3 py-2 rounded-xl"
                          style={{ background: 'linear-gradient(135deg, #7c3aed, #ec4899)' }}>
                          Принято
                        </button>
                      : <span className="text-xs text-green-600 font-bold bg-green-100 px-2 py-1 rounded-lg">✓</span>
                    }
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Heatmap */}
        <div className="card"><Heatmap logs={logs} /></div>

        {/* All medications */}
        {meds.length > 0 && (
          <div className="card">
            <h2 className="font-black text-gray-900 mb-4">Все препараты</h2>
            <div className="space-y-2">
              {meds.map(m => (
                <div key={m.id} className="flex items-center gap-3 p-3.5 bg-primary-50 rounded-2xl">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-xl">💊</div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-800">{m.name}</p>
                    <p className="text-xs text-gray-400 font-medium">{m.time} · {m.duration} дней · с {m.startDate}</p>
                  </div>
                  <button onClick={() => deleteMed(m.id)}
                    className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center text-red-400 font-bold">×</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <Modal title="Добавить препарат" onClose={() => setShowModal(false)}>
          <div className="space-y-4">
            <div>
              <label className="label">Название препарата</label>
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
            <button className="btn-primary" onClick={addMed}>Сохранить 💊</button>
          </div>
        </Modal>
      )}

      <BottomNav />
    </div>
  )
}
