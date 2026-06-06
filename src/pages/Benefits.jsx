import { useState } from 'react'
import { getUser } from '../utils/storage'
import BottomNav from '../components/BottomNav'

const MRP = 3932
const MZP = 85000

function calcBenefits({ salary, employment, pregnancyType, childOrder, pdr }) {
  const salaryNum = parseFloat(salary) || 0
  const pdrDate = pdr ? new Date(pdr) : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
  const isMultiple = pregnancyType === 'multiple'
  const decretDays = isMultiple ? 140 : 126

  // Декретные выплаты
  let decretPayment = 0
  if (employment === 'official' || employment === 'ip') {
    const dailySalary = (salaryNum || MZP) / 30
    decretPayment = Math.round(dailySalary * decretDays)
  } else if (employment === 'selfemployed') {
    decretPayment = Math.round(MRP * 15)
  } else {
    decretPayment = Math.round(MRP * 17)
  }

  // Единовременное пособие при рождении
  const birthBonus = {
    '1': MRP * 38,
    '2': MRP * 63,
    '3': MRP * 88,
    '4+': MRP * 113,
  }[childOrder] || MRP * 38

  // Ежемесячное по уходу до 1 года
  let monthlyAllowance = 0
  if (employment === 'official' || employment === 'ip') {
    monthlyAllowance = Math.min(Math.round(salaryNum * 0.4), MRP * 40)
    monthlyAllowance = Math.max(monthlyAllowance, MRP * 20)
  } else {
    monthlyAllowance = MRP * 20
  }

  // Ключевые даты
  const matLeaveStart = new Date(pdrDate.getTime() - 70 * 24 * 60 * 60 * 1000)
  const matLeaveEnd = new Date(pdrDate.getTime() + (decretDays - 70) * 24 * 60 * 60 * 1000)
  const to1Year = new Date(pdrDate.getTime() + 365 * 24 * 60 * 60 * 1000)
  const to3Years = new Date(pdrDate.getTime() + 3 * 365 * 24 * 60 * 60 * 1000)

  return {
    decretPayment,
    birthBonus: Math.round(birthBonus),
    monthlyAllowance,
    decretDays,
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

  const calculate = () => setResult(calcBenefits(form))

  const fmt = (n) => n.toLocaleString('ru-RU') + ' тг'

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-gradient-to-r from-primary-500 to-pink-400 text-white px-4 pt-12 pb-4">
        <div className="max-w-lg mx-auto">
          <h1 className="text-xl font-bold">Калькулятор выплат</h1>
          <p className="text-primary-100 text-sm mt-1">МРП 2025: {MRP.toLocaleString('ru-RU')} тг</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-5">
        {/* Input form */}
        <div className="card space-y-4">
          <h2 className="font-bold text-gray-800">Параметры расчёта</h2>

          <div>
            <label className="label">Среднемесячная зарплата (тг)</label>
            <input type="number" className="input-field" placeholder={`${MZP.toLocaleString('ru-RU')} (МЗП)`}
              value={form.salary} onChange={e => setForm(f => ({ ...f, salary: e.target.value }))} />
          </div>

          <div>
            <label className="label">Статус занятости</label>
            <select className="input-field" value={form.employment} onChange={e => setForm(f => ({ ...f, employment: e.target.value }))}>
              <option value="official">Официально трудоустроена</option>
              <option value="ip">ИП</option>
              <option value="selfemployed">Самозанятая</option>
              <option value="none">Не работаю</option>
            </select>
          </div>

          <div>
            <label className="label">Вид беременности</label>
            <select className="input-field" value={form.pregnancyType} onChange={e => setForm(f => ({ ...f, pregnancyType: e.target.value }))}>
              <option value="single">Одноплодная</option>
              <option value="multiple">Многоплодная</option>
            </select>
          </div>

          <div>
            <label className="label">Порядковый номер ребёнка</label>
            <select className="input-field" value={form.childOrder} onChange={e => setForm(f => ({ ...f, childOrder: e.target.value }))}>
              <option value="1">1-й ребёнок</option>
              <option value="2">2-й ребёнок</option>
              <option value="3">3-й ребёнок</option>
              <option value="4+">4-й и более</option>
            </select>
          </div>

          <div>
            <label className="label">Предполагаемая дата родов (ПДР)</label>
            <input type="date" className="input-field" value={form.pdr}
              onChange={e => setForm(f => ({ ...f, pdr: e.target.value }))} />
          </div>

          <button className="btn-primary w-full text-lg" onClick={calculate}>Рассчитать</button>
        </div>

        {/* Results */}
        {result && (
          <>
            <div className="card">
              <h2 className="font-bold text-gray-800 mb-4">Результаты расчёта</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-primary-50 rounded-xl">
                  <div>
                    <p className="font-medium text-gray-800 text-sm">Декретные выплаты</p>
                    <p className="text-xs text-gray-500">100% от среднедневного × {result.decretDays} дней</p>
                  </div>
                  <p className="text-primary-600 font-bold">{fmt(result.decretPayment)}</p>
                </div>

                <div className="flex items-center justify-between p-3 bg-pink-50 rounded-xl">
                  <div>
                    <p className="font-medium text-gray-800 text-sm">Единовременное при рождении</p>
                    <p className="text-xs text-gray-500">МРП × коэффициент</p>
                  </div>
                  <p className="text-pink-600 font-bold">{fmt(result.birthBonus)}</p>
                </div>

                <div className="flex items-center justify-between p-3 bg-orange-50 rounded-xl">
                  <div>
                    <p className="font-medium text-gray-800 text-sm">Ежемесячное до 1 года</p>
                    <p className="text-xs text-gray-500">40% от зарплаты</p>
                  </div>
                  <p className="text-orange-600 font-bold">{fmt(result.monthlyAllowance)}/мес</p>
                </div>

                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="font-medium text-gray-800 text-sm mb-1">За 12 месяцев до 1 года:</p>
                  <p className="text-green-600 font-bold text-lg">{fmt(result.monthlyAllowance * 12)}</p>
                </div>

                <div className="p-3 bg-green-50 rounded-xl">
                  <p className="font-medium text-gray-800 text-sm mb-1">Итого (ориентировочно):</p>
                  <p className="text-green-600 font-bold text-xl">
                    {fmt(result.decretPayment + result.birthBonus + result.monthlyAllowance * 12)}
                  </p>
                </div>
              </div>
            </div>

            <div className="card">
              <h2 className="font-bold text-gray-800 mb-4">Ключевые даты</h2>
              <div className="space-y-2">
                {[
                  { label: 'ПДР', value: result.pdrFormatted, icon: '👶' },
                  { label: 'Начало декрета (70 дней до ПДР)', value: result.matLeaveStart, icon: '📅' },
                  { label: 'Конец декретного отпуска', value: result.matLeaveEnd, icon: '🏁' },
                  { label: 'Конец отпуска до 1 года', value: result.to1Year, icon: '🎂' },
                  { label: 'Конец отпуска до 3 лет', value: result.to3Years, icon: '📆' },
                ].map(d => (
                  <div key={d.label} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <span className="text-xl">{d.icon}</span>
                    <div className="flex-1">
                      <p className="text-xs text-gray-500">{d.label}</p>
                      <p className="font-medium text-gray-800">{d.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card bg-yellow-50 border border-yellow-200">
              <h3 className="font-bold text-yellow-800 mb-2">Формулы расчёта</h3>
              <div className="text-xs text-yellow-700 space-y-1">
                <p>• МРП 2025 = {MRP.toLocaleString('ru-RU')} тг, МЗП = {MZP.toLocaleString('ru-RU')} тг</p>
                <p>• Декретные (офиц.) = среднедневной заработок × {result.decretDays} дней</p>
                <p>• Пособие при рождении: 1-й = 38 МРП, 2-й = 63 МРП, 3-й = 88 МРП, 4+ = 113 МРП</p>
                <p>• Ежемесячное = 40% от зарплаты (min 20 МРП, max 40 МРП)</p>
                <p>• Декрет = за 70 дней до ПДР + 56 дней после (70 дней при многоплодной)</p>
                <p className="text-yellow-600 mt-2">* Расчёт ориентировочный. Точные суммы уточняйте в ЕНПФ/работодателя.</p>
              </div>
            </div>
          </>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
