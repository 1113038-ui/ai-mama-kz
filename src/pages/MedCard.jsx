import { useState } from 'react'
import { getUser, setUser, getVisits, setVisits, getAnalyses, setAnalyses, getPrescriptions, setPrescriptions } from '../utils/storage'
import BottomNav from '../components/BottomNav'

const TABS = [
  { label: 'Основное', icon: '👤' },
  { label: 'Визиты', icon: '🏥' },
  { label: 'Анализы', icon: '🔬' },
  { label: 'Назначения', icon: '📋' },
]

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
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold">×</button>
        </div>
        {children}
      </div>
    </div>
  )
}

const empLabel = { official: 'Официально трудоустроена', ip: 'ИП', selfemployed: 'Самозанятая', none: 'Не работаю' }

export default function MedCard() {
  const [tab, setTab] = useState(0)
  const [user, setUserState] = useState(getUser() || {})
  const [visits, setVisitsState] = useState(getVisits())
  const [analyses, setAnalysesState] = useState(getAnalyses())
  const [prescriptions, setPrescriptionsState] = useState(getPrescriptions())
  const [showModal, setShowModal] = useState(null)
  const [editing, setEditing] = useState(false)

  const [visitForm, setVisitForm] = useState({ date: '', bp: '', weight: '', notes: '' })
  const [analysisForm, setAnalysisForm] = useState({ name: '', date: '', result: '', reference: '' })
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

  return (
    <div className="page-bg pb-28">
      {/* Header */}
      <div className="header-gradient px-5 pt-14 pb-4">
        <div className="max-w-lg mx-auto">
          <h1 className="text-2xl font-black text-white">Медицинская карта 📋</h1>
          <p className="text-purple-200 text-sm font-medium mt-1">Ваши данные всегда под рукой</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-lg border-b border-primary-100">
        <div className="max-w-lg mx-auto flex overflow-x-auto">
          {TABS.map((t, i) => (
            <button key={t.label} onClick={() => setTab(i)}
              className={`flex-1 py-3.5 text-xs font-bold whitespace-nowrap transition-all border-b-2 ${
                tab === i
                  ? 'border-primary-600 text-primary-700'
                  : 'border-transparent text-gray-400'
              }`}>
              <span className="mr-1">{t.icon}</span>{t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-5 py-5">
        {/* ОСНОВНОЕ */}
        {tab === 0 && (
          <div className="card space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-black text-gray-900">Личные данные</h2>
              {!editing
                ? <button onClick={() => setEditing(true)}
                    className="text-xs font-bold text-primary-600 bg-primary-50 px-3 py-1.5 rounded-xl">Изменить</button>
                : <button onClick={saveUser}
                    className="text-xs font-bold text-green-700 bg-green-50 px-3 py-1.5 rounded-xl">Сохранить</button>
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
                  ? <input type={f.type} className="input-field"
                      value={user[f.key] || ''}
                      onChange={e => setUserState(u => ({ ...u, [f.key]: e.target.value }))} />
                  : <div className="py-3 px-4 bg-primary-50 rounded-2xl text-gray-800 font-medium">
                      {user[f.key] || <span className="text-gray-300">Не заполнено</span>}
                    </div>
                }
              </div>
            ))}
            <div>
              <label className="label">Статус занятости</label>
              {editing
                ? <select className="input-field" value={user.employment || 'none'}
                    onChange={e => setUserState(u => ({ ...u, employment: e.target.value }))}>
                    <option value="official">Официально трудоустроена</option>
                    <option value="ip">ИП</option>
                    <option value="selfemployed">Самозанятая</option>
                    <option value="none">Не работаю</option>
                  </select>
                : <div className="py-3 px-4 bg-primary-50 rounded-2xl text-gray-800 font-medium">
                    {empLabel[user.employment] || <span className="text-gray-300">Не заполнено</span>}
                  </div>
              }
            </div>
          </div>
        )}

        {/* ВИЗИТЫ */}
        {tab === 1 && (
          <div className="space-y-4">
            <button onClick={() => setShowModal('visit')} className="btn-primary">+ Добавить визит</button>
            {visits.length === 0
              ? <div className="text-center py-10">
                  <p className="text-4xl mb-3">🏥</p>
                  <p className="text-gray-400 font-medium">Нет записей о визитах</p>
                </div>
              : visits.map(v => (
                <div key={v.id} className="card">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-black text-gray-900">{v.date}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {v.bp && `АД: ${v.bp}`}{v.bp && v.weight ? ' · ' : ''}{v.weight && `Вес: ${v.weight} кг`}
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-2xl bg-primary-50 flex items-center justify-center text-xl">🏥</div>
                  </div>
                  {v.notes && <p className="text-sm text-gray-600 mt-3 bg-primary-50 rounded-2xl p-3">{v.notes}</p>}
                </div>
              ))
            }
          </div>
        )}

        {/* АНАЛИЗЫ */}
        {tab === 2 && (
          <div className="space-y-4">
            <button onClick={() => setShowModal('analysis')} className="btn-primary">+ Добавить анализ</button>
            {analyses.length === 0
              ? <div className="text-center py-10">
                  <p className="text-4xl mb-3">🔬</p>
                  <p className="text-gray-400 font-medium">Нет результатов анализов</p>
                </div>
              : analyses.map(a => (
                <div key={a.id} className="card">
                  <div className="flex justify-between items-start">
                    <p className="font-black text-gray-900">{a.name}</p>
                    <span className="text-xs text-primary-400 font-semibold bg-primary-50 px-2 py-1 rounded-lg">{a.date}</span>
                  </div>
                  <p className="text-sm text-gray-700 mt-2">Результат: <span className="font-bold text-primary-700">{a.result}</span></p>
                  {a.reference && <p className="text-xs text-gray-400 mt-1">Норма: {a.reference}</p>}
                </div>
              ))
            }
          </div>
        )}

        {/* НАЗНАЧЕНИЯ */}
        {tab === 3 && (
          <div className="space-y-4">
            <button onClick={() => setShowModal('presc')} className="btn-primary">+ Добавить назначение</button>
            {prescriptions.length === 0
              ? <div className="text-center py-10">
                  <p className="text-4xl mb-3">📋</p>
                  <p className="text-gray-400 font-medium">Нет назначений</p>
                </div>
              : prescriptions.map(p => (
                <div key={p.id} className="card">
                  <p className="font-black text-gray-900">{p.drug}</p>
                  <p className="text-sm text-gray-600 mt-1">{p.schema}</p>
                  {p.course && <p className="text-xs text-primary-500 font-semibold mt-1 bg-primary-50 px-3 py-1.5 rounded-xl inline-block">Курс: {p.course} дней</p>}
                </div>
              ))
            }
          </div>
        )}
      </div>

      {/* MODALS */}
      {showModal === 'visit' && (
        <Modal title="Добавить визит 🏥" onClose={() => setShowModal(null)}>
          <div className="space-y-4">
            {[['date','Дата','date'],['bp','АД (например, 120/80)','text'],['weight','Вес (кг)','number']].map(([k,l,t]) => (
              <div key={k}>
                <label className="label">{l}</label>
                <input type={t} className="input-field" value={visitForm[k]}
                  onChange={e => setVisitForm(f => ({ ...f, [k]: e.target.value }))} />
              </div>
            ))}
            <div>
              <label className="label">Назначения / заметки</label>
              <textarea className="input-field" rows={3} value={visitForm.notes}
                onChange={e => setVisitForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
            <button className="btn-primary" onClick={addVisit}>Сохранить</button>
          </div>
        </Modal>
      )}
      {showModal === 'analysis' && (
        <Modal title="Добавить анализ 🔬" onClose={() => setShowModal(null)}>
          <div className="space-y-4">
            {[['name','Название анализа','text'],['date','Дата','date'],['result','Результат','text'],['reference','Референсные значения','text']].map(([k,l,t]) => (
              <div key={k}>
                <label className="label">{l}</label>
                <input type={t} className="input-field" value={analysisForm[k]}
                  onChange={e => setAnalysisForm(f => ({ ...f, [k]: e.target.value }))} />
              </div>
            ))}
            <button className="btn-primary" onClick={addAnalysis}>Сохранить</button>
          </div>
        </Modal>
      )}
      {showModal === 'presc' && (
        <Modal title="Добавить назначение 📋" onClose={() => setShowModal(null)}>
          <div className="space-y-4">
            {[['drug','Препарат','text'],['schema','Схема приёма','text'],['course','Курс (дней)','number']].map(([k,l,t]) => (
              <div key={k}>
                <label className="label">{l}</label>
                <input type={t} className="input-field" value={prescForm[k]}
                  onChange={e => setPrescForm(f => ({ ...f, [k]: e.target.value }))} />
              </div>
            ))}
            <button className="btn-primary" onClick={addPresc}>Сохранить</button>
          </div>
        </Modal>
      )}

      <BottomNav />
    </div>
  )
}
