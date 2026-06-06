import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { setUser } from '../utils/storage'

const STEPS = 3

export default function Onboarding() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    // Step 1
    fullName: '', iin: '', birthDate: '', phone: '',
    // Step 2
    pregnancyWeeks: '', lastPeriod: '', city: '', clinic: '',
    // Step 3
    employment: 'official', salary: ''
  })
  const [errors, setErrors] = useState({})

  const update = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
    setErrors(prev => ({ ...prev, [field]: '' }))
  }

  const validateStep = () => {
    const e = {}
    if (step === 1) {
      if (!form.fullName.trim()) e.fullName = 'Введите ФИО'
      if (!/^\d{12}$/.test(form.iin)) e.iin = 'ИИН должен содержать 12 цифр'
      if (!form.birthDate) e.birthDate = 'Укажите дату рождения'
      if (!form.phone.trim()) e.phone = 'Введите номер телефона'
    }
    if (step === 2) {
      if (!form.pregnancyWeeks && !form.lastPeriod) e.pregnancyWeeks = 'Укажите срок беременности или дату последней менструации'
      if (!form.city.trim()) e.city = 'Укажите город'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const next = () => {
    if (!validateStep()) return
    if (step < STEPS) setStep(s => s + 1)
    else {
      // Calculate PDR
      let weeks = parseInt(form.pregnancyWeeks) || 0
      let pdr = null
      if (form.lastPeriod) {
        const lmp = new Date(form.lastPeriod)
        pdr = new Date(lmp.getTime() + 280 * 24 * 60 * 60 * 1000)
        weeks = Math.round((Date.now() - lmp.getTime()) / (7 * 24 * 60 * 60 * 1000))
      } else if (weeks) {
        const now = new Date()
        pdr = new Date(now.getTime() + (40 - weeks) * 7 * 24 * 60 * 60 * 1000)
      }
      setUser({ ...form, weeks, pdr: pdr ? pdr.toISOString() : null, createdAt: new Date().toISOString() })
      navigate('/dashboard')
    }
  }

  const inputCls = (field) => `input-field ${errors[field] ? 'border-red-400 ring-1 ring-red-300' : ''}`

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-pink-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🤱</div>
          <h1 className="text-3xl font-bold text-primary-600">AI Mama KZ</h1>
          <p className="text-gray-500 mt-1">Персональный навигатор по беременности</p>
        </div>

        {/* Progress */}
        <div className="flex items-center mb-8 gap-2">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex-1 flex flex-col items-center gap-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                s < step ? 'bg-primary-500 text-white' :
                s === step ? 'bg-primary-500 text-white ring-4 ring-primary-200' :
                'bg-gray-200 text-gray-400'
              }`}>{s < step ? '✓' : s}</div>
              <div className={`h-1 w-full rounded-full ${s <= step ? 'bg-primary-400' : 'bg-gray-200'}`} />
            </div>
          ))}
        </div>

        <div className="card shadow-lg">
          {step === 1 && (
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-5">Личные данные</h2>
              <div className="space-y-4">
                <div>
                  <label className="label">ФИО *</label>
                  <input className={inputCls('fullName')} placeholder="Иванова Айгуль Жумабековна"
                    value={form.fullName} onChange={e => update('fullName', e.target.value)} />
                  {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
                </div>
                <div>
                  <label className="label">ИИН *</label>
                  <input className={inputCls('iin')} placeholder="123456789012" maxLength={12}
                    value={form.iin} onChange={e => update('iin', e.target.value.replace(/\D/g, ''))} />
                  {errors.iin && <p className="text-red-500 text-xs mt-1">{errors.iin}</p>}
                </div>
                <div>
                  <label className="label">Дата рождения *</label>
                  <input type="date" className={inputCls('birthDate')}
                    value={form.birthDate} onChange={e => update('birthDate', e.target.value)} />
                  {errors.birthDate && <p className="text-red-500 text-xs mt-1">{errors.birthDate}</p>}
                </div>
                <div>
                  <label className="label">Телефон *</label>
                  <input className={inputCls('phone')} placeholder="+7 777 123 4567"
                    value={form.phone} onChange={e => update('phone', e.target.value)} />
                  {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-5">Беременность</h2>
              <div className="space-y-4">
                <div>
                  <label className="label">Срок беременности (недели)</label>
                  <input type="number" className={inputCls('pregnancyWeeks')} placeholder="например, 20" min={1} max={42}
                    value={form.pregnancyWeeks} onChange={e => update('pregnancyWeeks', e.target.value)} />
                </div>
                <div className="relative flex items-center gap-3">
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-xs text-gray-400">или</span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>
                <div>
                  <label className="label">Дата последней менструации</label>
                  <input type="date" className={inputCls('lastPeriod')}
                    value={form.lastPeriod} onChange={e => update('lastPeriod', e.target.value)} />
                  {errors.pregnancyWeeks && <p className="text-red-500 text-xs mt-1">{errors.pregnancyWeeks}</p>}
                </div>
                <div>
                  <label className="label">Город *</label>
                  <input className={inputCls('city')} placeholder="Алматы"
                    value={form.city} onChange={e => update('city', e.target.value)} />
                  {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
                </div>
                <div>
                  <label className="label">Женская консультация</label>
                  <input className="input-field" placeholder="ЖК №1, ул. Примерная"
                    value={form.clinic} onChange={e => update('clinic', e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-5">Занятость</h2>
              <div className="space-y-4">
                <div>
                  <label className="label">Статус занятости</label>
                  <select className="input-field" value={form.employment} onChange={e => update('employment', e.target.value)}>
                    <option value="official">Официально трудоустроена</option>
                    <option value="ip">ИП</option>
                    <option value="selfemployed">Самозанятая</option>
                    <option value="none">Не работаю</option>
                  </select>
                </div>
                <div>
                  <label className="label">Средняя зарплата (тг) — необязательно</label>
                  <input type="number" className="input-field" placeholder="150000"
                    value={form.salary} onChange={e => update('salary', e.target.value)} />
                </div>
                <div className="bg-primary-50 rounded-xl p-4 mt-2">
                  <p className="text-sm text-primary-700">
                    💡 Эти данные помогут рассчитать размер декретных выплат. Вы можете изменить их позже.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 mt-6">
            {step > 1 && (
              <button className="btn-secondary flex-1" onClick={() => setStep(s => s - 1)}>Назад</button>
            )}
            <button className="btn-primary flex-1" onClick={next}>
              {step === STEPS ? 'Начать' : 'Далее'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
