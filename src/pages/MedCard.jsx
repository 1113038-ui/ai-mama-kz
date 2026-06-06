import { useState } from 'react'
import { getUser, setUser, getVisits, setVisits, getAnalyses, setAnalyses, getPrescriptions, setPrescriptions } from '../utils/storage'
import BottomNav from '../components/BottomNav'

const TABS = ['Основное', 'Визиты', 'Анализы', 'Назначения']

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

export default function MedCard() {
  const [tab, setTab] = useState(0)
  const [user, setUserState] = useState(getUser() || {})
  const [visits, setVisitsState] = useState(getVisits())
  const [analyses, setAnalysesState] = useState(getAnalyses())
  const [prescriptions, setPrescriptionsState] = useState(getPrescriptions())
  const [showModal, setShowModal] = useState(null)
  const [editing, setEditing] = useState(false)

  // Visit form
  const [visitForm, setVisitForm] = useState({ date: '', bp: '', weight: '', notes: '' })
  // Analysis form
  const [analysisForm, setAnalysisForm] = useState({ name: '', date: '', result: '', reference: '' })
  // Prescription form
  const [prescForm, setPrescForm] = useState({ drug: '', schema: '', course: '' })

  const saveUser = () => { setUser(user); setEditing(false) }

  const addVisit = () => {
    const v = [...visits, { ...visitForm, id: Date.now() }]
    setVisits(v); setVisitsState(v); setShowModal(null)
    setVisitForm({ date: '', bp: '', weight: '', notes: '' })
  }
  const addAnalysis = () => {
    const a = [...analyses, { ...analysisForm, id: Date.now() }]
    setAnalyses(a); setAnalysesState(a); setShowModal(null)
    setAnalysisForm({ name: '', date: '', result: '', reference: '' })
  }
  const addPresc = () => {
    const p = [...prescriptions, { ...prescForm, id: Date.now() }]
    setPrescriptions(p); setPrescriptionsState(p); setShowModal(null)
    setPrescForm({ drug: '', schema: '', course: '' })
  }

  const employmentLabel = { official: 'Официально трудоустроена', ip: 'ИП', selfemployed: 'Самозанятая', none: 'Не работаю' }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-500 to-pink-400 text-white px-4 pt-12 pb-4">
        <div className="max-w-lg mx-auto">
          <h1 className="text-xl font-bold">Цифровая медкарта</h1>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-lg mx-auto flex overflow-x-auto">
          {TABS.map((t, i) => (
            <button key={t} onClick={() => setTab(i)}
              className={`flex-1 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
                tab === i ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500'
              }`}>{t}</button>
          ))}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5">
        {/* Основное */}
        {tab === 0 && (
          <div className="card space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-gray-800">Личные данные</h2>
              {!editing
                ? <button onClick={() => setEditing(true)} className="text-primary-500 text-sm font-medium">Изменить</button>
                : <button onClick={saveUser} className="text-green-600 text-sm font-medium">Сохранить</button>
              }
            </div>
            {[
              { label: 'ФИО', key: 'fullName', type: 'text' },
              { label: 'ИИН', key: 'iin', type: 'text' },
              { label: 'Дата рождения', key: 'birthDate', type: 'date' },
              { label: 'Телефон', key: 'phone', type: 'text' },
              { label: 'Город', key: 'city', type: 'text' },
              { label: 'Женская консультация', key: 'clinic', type: 'text' },
              { label: 'Срок беременности (нед.)', key: 'weeks', type: 'number' },
            ].map(f => (
              <div key={f.key}>
                <label className="label">{f.label}</label>
                {editing
                  ? <input type={f.type} className="input-field" value={user[f.key] || ''} onChange={e => setUserState(u => ({ ...u, [f.key]: e.target.value }))} />
                  : <p className="py-2 px-3 bg-gray-50 rounded-xl text-gray-700">{user[f.key] || '—'}</p>
                }
              </div>
            ))}
            <div>
              <label className="label">Статус занятости</label>
              {editing
                ? <select className="input-field" value={user.employment || 'none'} onChange={e => setUserState(u => ({ ...u, employment: e.target.value }))}>
                    <option value="official">Официально трудоустроена</option>
                    <option value="ip">ИП</option>
                    <option value="selfemployed">Самозанятая</option>
                    <option value="none">Не работаю</option>
                  </select>
                : <p className="py-2 px-3 bg-gray-50 rounded-xl text-gray-700">{employmentLabel[user.employment] || '—'}</p>
              }
            </div>
          </div>
        )}

        {/* Визиты */}
        {tab === 1 && (
          <div className="space-y-4">
            <button onClick={() => setShowModal('visit')} className="btn-primary w-full">+ Добавить визит</button>
            {visits.length === 0
              ? <p className="text-center text-gray-400 py-8">Нет записей о визитах</p>
              : visits.map(v => (
                <div key={v.id} className="card">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-gray-800">{v.date}</p>
                      <p className="text-sm text-gray-500 mt-1">АД: {v.bp || '—'} | Вес: {v.weight || '—'} кг</p>
                    </div>
                    <span className="text-primary-500 text-sm">🏥</span>
                  </div>
                  {v.notes && <p className="text-sm text-gray-600 mt-2 bg-gray-50 rounded-lg p-2">{v.notes}</p>}
                </div>
              ))
            }
          </div>
        )}

        {/* Анализы */}
        {tab === 2 && (
          <div className="space-y-4">
            <button onClick={() => setShowModal('analysis')} className="btn-primary w-full">+ Добавить анализ</button>
            {analyses.length === 0
              ? <p className="text-center text-gray-400 py-8">Нет результатов анализов</p>
              : analyses.map(a => (
                <div key={a.id} className="card">
                  <div className="flex justify-between">
                    <p className="font-bold text-gray-800">{a.name}</p>
                    <span className="text-xs text-gray-400">{a.date}</span>
                  </div>
                  <p className="text-sm text-gray-700 mt-1">Результат: <span className="font-medium">{a.result}</span></p>
                  {a.reference && <p className="text-xs text-gray-400 mt-1">Референс: {a.reference}</p>}
                </div>
              ))
            }
          </div>
        )}

        {/* Назначения */}
        {tab === 3 && (
          <div className="space-y-4">
            <button onClick={() => setShowModal('presc')} className="btn-primary w-full">+ Добавить назначение</button>
            {prescriptions.length === 0
              ? <p className="text-center text-gray-400 py-8">Нет назначений</p>
              : prescriptions.map(p => (
                <div key={p.id} className="card">
                  <p className="font-bold text-gray-800">{p.drug}</p>
                  <p className="text-sm text-gray-600 mt-1">Схема: {p.schema}</p>
                  {p.course && <p className="text-sm text-gray-400">Курс: {p.course}</p>}
                </div>
              ))
            }
          </div>
        )}
      </div>

      {/* Modals */}
      {showModal === 'visit' && (
        <Modal title="Добавить визит" onClose={() => setShowModal(null)}>
          <div className="space-y-3">
            {[['date', 'Дата', 'date'], ['bp', 'АД (например, 120/80)', 'text'], ['weight', 'Вес (кг)', 'number']].map(([k, l, t]) => (
              <div key={k}>
                <label className="label">{l}</label>
                <input type={t} className="input-field" value={visitForm[k]} onChange={e => setVisitForm(f => ({ ...f, [k]: e.target.value }))} />
              </div>
            ))}
            <div>
              <label className="label">Назначения / заметки</label>
              <textarea className="input-field" rows={3} value={visitForm.notes} onChange={e => setVisitForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
            <button className="btn-primary w-full" onClick={addVisit}>Сохранить</button>
          </div>
        </Modal>
      )}

      {showModal === 'analysis' && (
        <Modal title="Добавить анализ" onClose={() => setShowModal(null)}>
          <div className="space-y-3">
            {[['name', 'Название анализа', 'text'], ['date', 'Дата', 'date'], ['result', 'Результат', 'text'], ['reference', 'Референсные значения', 'text']].map(([k, l, t]) => (
              <div key={k}>
                <label className="label">{l}</label>
                <input type={t} className="input-field" value={analysisForm[k]} onChange={e => setAnalysisForm(f => ({ ...f, [k]: e.target.value }))} />
              </div>
            ))}
            <button className="btn-primary w-full" onClick={addAnalysis}>Сохранить</button>
          </div>
        </Modal>
      )}

      {showModal === 'presc' && (
        <Modal title="Добавить назначение" onClose={() => setShowModal(null)}>
          <div className="space-y-3">
            {[['drug', 'Препарат', 'text'], ['schema', 'Схема приёма', 'text'], ['course', 'Курс (дней)', 'number']].map(([k, l, t]) => (
              <div key={k}>
                <label className="label">{l}</label>
                <input type={t} className="input-field" value={prescForm[k]} onChange={e => setPrescForm(f => ({ ...f, [k]: e.target.value }))} />
              </div>
            ))}
            <button className="btn-primary w-full" onClick={addPresc}>Сохранить</button>
          </div>
        </Modal>
      )}

      <BottomNav />
    </div>
  )
}
