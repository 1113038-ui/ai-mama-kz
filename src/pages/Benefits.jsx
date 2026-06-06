import { useState } from 'react'
import { getUser } from '../utils/storage'
import BottomNav from '../components/BottomNav'

const MRP = 3932
const MZP = 85000

function calcBenefits({ salary, employment, pregnancyType, childOrder, pdr }) {
  const salaryNum = parseFloat(salary) || 0
  const pdrDate = pdr ? new Date(pdr) : new Date(Date.now() + 90 * 864e5)
  const isMultiple = pregnancyType === 'multiple'
  const decretDays = isMultiple ? 140 : 126

  let decretPayment = 0
  if (employment === 'official' || employment === 'ip') {
    decretPayment = Math.round(((salaryNum || MZP) / 30) * decretDays)
  } else if (employment === 'selfemployed') {
    decretPayment = Math.round(MRP * 15)
  } else {
    decretPayment = Math.round(MRP * 17)
  }

  const coeffs = { '1': 38, '2': 63, '3': 88, '4+': 113 }
  const birthBonus = Math.round((coeffs[childOrder] || 38) * MRP)

  let monthlyAllowance = (employment === 'official' || employment === 'ip')
    ? Math.min(Math.round(salaryNum * 0.4), MRP * 40)
    : MRP * 20
  monthlyAllowance = Math.max(monthlyAllowance, MRP * 20)

  const matLeaveStart = new Date(pdrDate.getTime() - 70 * 864e5)
  const matLeaveEnd = new Date(pdrDate.getTime() + (decretDays - 70) * 864e5)
  const to1Year = new Date(pdrDate.getTime() + 365 * 864e5)
  const to3Years = new Date(pdrDate.getTime() + 3 * 365 * 864e5)

  return {
    decretPayment, birthBonus, monthlyAllowance, decretDays,
    matLeaveStart: matLeaveStart.toLocaleDateString('ru-RU'),
    matLeaveEnd: matLeaveEnd.toLocaleDateString('ru-RU'),
    to1Year: to1Year.toLocaleDateString('ru-RU'),
    to3Years: to3Years.toLocaleDateString('ru-RU'),
    pdrFormatted: pdrDate.toLocaleDateString('ru-RU'),
  }
}

export default function Benefits() {
  const user = getUser() || {}
  const [form, setForm] = useState({
    salary: user.salary || '',
    employment: user.employment || 'official',
    pregnancyType: 'single',
    childOrder: '1',
    pdr: user.pdr ? new Date(user.pdr).toISOString().split('T')[0] : ''
  })
  const [result, setResult] = useState(null)

  const fmt = n => n.toLocaleString('ru-RU') + ' тг'
  const u = (f, v) => setForm(p => ({ ...p, [f]: v }))

  return (
    <div className="page-bg pb-28">
      {/* Header */}
      <div className="header-gradient px-5 pt-14 pb-6">
        <div className="max-w-lg mx-auto">
          <h1 className="text-2xl font-black text-white">Калькулятор выплат 💰</h1>
          <p className="text-purple-200 text-sm font-medium mt-1">МРП 2025 = {MRP.toLocaleString('ru-RU')} тг</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-5 mt-4 space-y-4">
        {/* Form */}
        <div className="card space-y-4">
          <h2 className="font-black text-gray-900">Параметры расчёта</h2>

          <div>
            <label className="label">Среднемесячная зарплата (тг)</label>
            <input type="number" className="input-field" placeholder={`${MZP.toLocaleString('ru-RU')} (МЗП)`}
              inputMode="numeric" value={form.salary} onChange={e => u('salary', e.target.value)} />
          </div>
          <div>
            <label className="label">Статус занятости</label>
            <select className="input-field" value={form.employment} onChange={e => u('employment', e.target.value)}>
              <option value="official">Официально трудоустроена</option>
              <option value="ip">ИП</option>
              <option value="selfemployed">Самозанятая</option>
              <option value="none">Не работаю</option>
            </select>
          </div>
          <div>
            <label className="label">Вид беременности</label>
            <select className="input-field" value={form.pregnancyType} onChange={e => u('pregnancyType', e.target.value)}>
              <option value="single">Одноплодная</option>
              <option value="multiple">Многоплодная</option>
            </select>
          </div>
          <div>
            <label className="label">Порядковый номер ребёнка</label>
            <select className="input-field" value={form.childOrder} onChange={e => u('childOrder', e.target.value)}>
              <option value="1">1-й ребёнок</option>
              <option value="2">2-й ребёнок</option>
              <option value="3">3-й ребёнок</option>
              <option value="4+">4-й и более</option>
            </select>
          </div>
          <div>
            <label className="label">Предполагаемая дата родов (ПДР)</label>
            <input type="date" className="input-field" value={form.pdr} onChange={e => u('pdr', e.target.value)} />
          </div>

          <button className="btn-primary text-base font-black" onClick={() => setResult(calcBenefits(form))}>
            Рассчитать 🔢
          </button>
        </div>

        {/* Results */}
        {result && (
          <>
            {/* Total highlight */}
            <div className="card-gradient">
              <p className="text-purple-200 text-sm font-semibold mb-1">Итого (ориентировочно)</p>
              <p className="text-4xl font-black text-white">
                {fmt(result.decretPayment + result.birthBonus + result.monthlyAllowance * 12)}
              </p>
              <p className="text-purple-200 text-xs mt-2 font-medium">За весь период (включая 12 мес. пособия)</p>
            </div>

            {/* Breakdown */}
            <div className="card space-y-3">
              <h2 className="font-black text-gray-900">Детализация выплат</h2>

              {[
                {
                  label: 'Декретные выплаты',
                  sub: `100% от среднедневного × ${result.decretDays} дней`,
                  value: fmt(result.decretPayment),
                  grad: 'from-violet-500 to-purple-400',
                  icon: '📄'
                },
                {
                  label: 'Единовременное при рождении',
                  sub: 'МРП × коэффициент по очерёдности',
                  value: fmt(result.birthBonus),
                  grad: 'from-pink-500 to-rose-400',
                  icon: '🎁'
                },
                {
                  label: 'Ежемесячное до 1 года',
                  sub: '40% от зарплаты',
                  value: fmt(result.monthlyAllowance) + '/мес',
                  grad: 'from-fuchsia-500 to-pink-400',
                  icon: '👶'
                },
                {
                  label: 'За 12 месяцев до 1 года',
                  sub: 'Ежемесячное × 12',
                  value: fmt(result.monthlyAllowance * 12),
                  grad: 'from-purple-500 to-violet-400',
                  icon: '📅'
                },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-3 p-3.5 rounded-2xl bg-primary-50">
                  <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${item.grad} flex items-center justify-center text-xl flex-none`}>
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-800 text-sm">{item.label}</p>
                    <p className="text-xs text-gray-400 truncate">{item.sub}</p>
                  </div>
                  <p className="font-black text-primary-700 text-sm text-right flex-none">{item.value}</p>
                </div>
              ))}
            </div>

            {/* Key dates */}
            <div className="card">
              <h2 className="font-black text-gray-900 mb-4">Ключевые даты</h2>
              <div className="space-y-2">
                {[
                  { label: 'ПДР', value: result.pdrFormatted, icon: '👶' },
                  { label: 'Начало декрета', value: result.matLeaveStart, icon: '📅' },
                  { label: 'Конец декрета', value: result.matLeaveEnd, icon: '🏁' },
                  { label: 'Конец отпуска до 1 года', value: result.to1Year, icon: '🎂' },
                  { label: 'Конец отпуска до 3 лет', value: result.to3Years, icon: '📆' },
                ].map(d => (
                  <div key={d.label} className="flex items-center gap-3 p-3 rounded-2xl bg-primary-50">
                    <span className="text-xl w-8 text-center">{d.icon}</span>
                    <div>
                      <p className="text-xs text-gray-400 font-medium">{d.label}</p>
                      <p className="font-bold text-gray-800">{d.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Disclaimer */}
            <div className="rounded-3xl p-4" style={{ background: 'linear-gradient(135deg, #ede9fe, #fce7f3)', border: '1px solid rgba(196,181,253,0.4)' }}>
              <p className="text-xs text-primary-600 font-medium">
                ⚠️ Расчёт ориентировочный. Точные суммы уточняйте у работодателя или в ГЦВП.<br /><br />
                МРП 2025 = {MRP.toLocaleString('ru-RU')} тг · МЗП = {MZP.toLocaleString('ru-RU')} тг<br />
                Декретные: 1-й = 38 МРП · 2-й = 63 МРП · 3-й = 88 МРП · 4+ = 113 МРП
              </p>
            </div>
          </>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
