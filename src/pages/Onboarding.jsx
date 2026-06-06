import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { setUser } from '../utils/storage'

const STEPS = 3

const stepTitles = ['Личные данные', 'Беременность', 'Занятость']
const stepIcons = ['👤', '🤰', '💼']

export default function Onboarding() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    fullName: '', iin: '', birthDate: '', phone: '',
    pregnancyWeeks: '', lastPeriod: '', city: '', clinic: '',
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
      if (!/^\d{12}$/.test(form.iin)) e.iin = 'ИИН — 12 цифр'
      if (!form.birthDate) e.birthDate = 'Укажите дату рождения'
      if (!form.phone.trim()) e.phone = 'Введите номер телефона'
    }
    if (step === 2) {
      if (!form.pregnancyWeeks && !form.lastPeriod) e.pregnancyWeeks = 'Укажите срок или дату последней менструации'
      if (!form.city.trim()) e.city = 'Укажите город'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const next = () => {
    if (!validateStep()) return
    if (step < STEPS) { setStep(s => s + 1); return }
    let weeks = parseInt(form.pregnancyWeeks) || 0
    let pdr = null
    if (form.lastPeriod) {
      const lmp = new Date(form.lastPeriod)
      pdr = new Date(lmp.getTime() + 280 * 24 * 60 * 60 * 1000)
      weeks = Math.round((Date.now() - lmp.getTime()) / (7 * 24 * 60 * 60 * 1000))
    } else if (weeks) {
      pdr = new Date(Date.now() + (40 - weeks) * 7 * 24 * 60 * 60 * 1000)
    }
    setUser({ ...form, weeks, pdr: pdr ? pdr.toISOString() : null, createdAt: new Date().toISOString() })
    navigate('/dashboard')
  }

  const inp = (field) =>
    `input-field${errors[field] ? ' !border-red-400 !ring-1 !ring-red-300' : ''}`

  return (
    <div className="min-h-screen flex flex-col" style={{
      background: 'linear-gradient(160deg, #2e1065 0%, #5b21b6 40%, #7c3aed 70%, #ec4899 100%)'
    }}>
      {/* Top section */}
      <div className="flex-none pt-14 pb-8 px-6 text-center">
        <div className="text-5xl mb-3">🌸</div>
        <h1 className="text-3xl font-black text-white tracking-tight">AI Mama KZ</h1>
        <p className="text-purple-200 mt-1 text-sm font-medium">Персональный навигатор по беременности</p>
      </div>

      {/* Step indicator */}
      <div className="px-8 mb-6">
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 right-0 top-5 h-0.5 bg-white/20 z-0" />
          {[1, 2, 3].map(s => (
            <div key={s} className="flex flex-col items-center gap-2 z-10">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold transition-all duration-300 ${
                s < step ? 'bg-green-400 text-white shadow-lg' :
                s === step ? 'bg-white text-primary-700 shadow-glow' :
                'bg-white/20 text-white/50'
              }`}>
                {s < step ? '✓' : stepIcons[s - 1]}
              </div>
              <span className={`text-xs font-semibold ${s === step ? 'text-white' : 'text-white/50'}`}>
                {stepTitles[s - 1]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Card */}
      <div className="flex-1 bg-white rounded-t-[2.5rem] px-6 pt-8 pb-10 overflow-y-auto"
        style={{ boxShadow: '0 -8px 40px rgba(0,0,0,0.15)' }}>

        <h2 className="text-2xl font-black text-gray-900 mb-1">{stepTitles[step - 1]}</h2>
        <p className="text-sm text-primary-400 font-medium mb-6">
          Шаг {step} из {STEPS}
        </p>

        {/* Step 1 */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="label">ФИО</label>
              <input className={inp('fullName')} placeholder="Иванова Айгуль Жумабековна"
                value={form.fullName} onChange={e => update('fullName', e.target.value)} />
              {errors.fullName && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.fullName}</p>}
            </div>
            <div>
              <label className="label">ИИН</label>
              <input className={inp('iin')} placeholder="123456789012" maxLength={12} inputMode="numeric"
                value={form.iin} onChange={e => update('iin', e.target.value.replace(/\D/g, ''))} />
              {errors.iin && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.iin}</p>}
            </div>
            <div>
              <label className="label">Дата рождения</label>
              <input type="date" className={inp('birthDate')}
                value={form.birthDate} onChange={e => update('birthDate', e.target.value)} />
              {errors.birthDate && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.birthDate}</p>}
            </div>
            <div>
              <label className="label">Номер телефона</label>
              <input className={inp('phone')} placeholder="+7 777 123 4567" inputMode="tel"
                value={form.phone} onChange={e => update('phone', e.target.value)} />
              {errors.phone && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.phone}</p>}
            </div>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label className="label">Срок беременности (недели)</label>
              <input type="number" className={inp('pregnancyWeeks')} placeholder="например, 20"
                min={1} max={42} inputMode="numeric"
                value={form.pregnancyWeeks} onChange={e => update('pregnancyWeeks', e.target.value)} />
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-primary-100" />
              <span className="text-xs text-primary-300 font-semibold uppercase tracking-wide">или</span>
              <div className="flex-1 h-px bg-primary-100" />
            </div>
            <div>
              <label className="label">Дата последней менструации</label>
              <input type="date" className={inp('lastPeriod')}
                value={form.lastPeriod} onChange={e => update('lastPeriod', e.target.value)} />
              {errors.pregnancyWeeks && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.pregnancyWeeks}</p>}
            </div>
            <div>
              <label className="label">Город</label>
              <input className={inp('city')} placeholder="Алматы"
                value={form.city} onChange={e => update('city', e.target.value)} />
              {errors.city && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.city}</p>}
            </div>
            <div>
              <label className="label">Женская консультация <span className="text-primary-300 font-normal">(необязательно)</span></label>
              <input className="input-field" placeholder="ЖК №1, ул. Примерная"
                value={form.clinic} onChange={e => update('clinic', e.target.value)} />
            </div>
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
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
              <label className="label">Средняя зарплата (тг) <span className="text-primary-300 font-normal">— необязательно</span></label>
              <input type="number" className="input-field" placeholder="150 000" inputMode="numeric"
                value={form.salary} onChange={e => update('salary', e.target.value)} />
            </div>
            <div className="rounded-2xl p-4 mt-2"
              style={{ background: 'linear-gradient(135deg, #ede9fe 0%, #fce7f3 100%)', border: '1px solid rgba(196,181,253,0.4)' }}>
              <p className="text-sm text-primary-700 font-medium">
                💡 Данные о зарплате нужны для расчёта декретных выплат. Вы сможете изменить их позже.
              </p>
            </div>
          </div>
        )}

        <div className="flex gap-3 mt-8">
          {step > 1 && (
            <button className="btn-secondary flex-1" onClick={() => setStep(s => s - 1)}>Назад</button>
          )}
          <button className="btn-primary flex-1" onClick={next}>
            {step === STEPS ? '🚀 Начать' : 'Далее →'}
          </button>
        </div>
      </div>
    </div>
  )
}
