import { useState } from 'react'

export const ASTANA_CLINICS = [
  { name: 'Городская поликлиника №1', address: 'ул. Сейфуллина, 28', phone: '32-36-40', district: 'Алматинский' },
  { name: 'Городская поликлиника №2', address: 'пр. Республики, 50', phone: '39-65-19', district: 'Алматинский' },
  { name: 'Городская поликлиника №3', address: 'пр. Республики, 56', phone: '31-06-94', district: 'Алматинский' },
  { name: 'Городская поликлиника №4', address: 'ул. Шевченко, 1', phone: '51-88-41', district: 'Сарыарка' },
  { name: 'Городская поликлиника №5', address: 'ул. Ақан сері, 20', phone: '28-90-16', district: 'Байконур' },
  { name: 'Городская поликлиника №6', address: 'ул. Аманат, 3', phone: '35-34-24', district: 'Есиль' },
  { name: 'Городская поликлиника №7', address: 'пр. Ш. Құдайбердіұлы, 25', phone: '79-36-86', district: 'Есиль' },
  { name: 'Городская поликлиника №8', address: 'ул. Сембинова, 4/1', phone: '52-41-56', district: 'Сарыарка' },
  { name: 'Городская поликлиника №9', address: 'пр. Мәңгілік Ел, 16/1', phone: '98-39-01', district: 'Есиль' },
  { name: 'Городская поликлиника №10', address: 'ул. Ш. Косшыгулулы, 8', phone: '70-87-89', district: 'Есиль' },
  { name: 'Городская поликлиника №11', address: 'пр. Абылай Хана, 30', phone: '36-08-81', district: 'Алматинский' },
  { name: 'Городская поликлиника №12', address: 'ул. Белкарагай, 1', phone: '95-41-08', district: 'Байконур' },
  { name: 'Городская поликлиника №13', address: 'пр. Абылай Хана, 1', phone: '49-77-10', district: 'Алматинский' },
  { name: 'Городская поликлиника №14', address: 'пр. Женис, 81', phone: '', district: 'Байконур' },
  { name: 'Городская поликлиника №15', address: 'пр. Р. Кошкарбаева, 64', phone: '28-04-78', district: 'Алматинский' },
  { name: 'Многопрофильный медицинский центр', address: 'ул. Манаса, 17', phone: '54-19-92', district: 'Сарыарка' },
  { name: 'ЦПМСП «Достық»', address: 'ул. Досмухамедулы, 24', phone: '64-78-85', district: 'Байконур' },
]

export default function ClinicDropdown({ value, onChange }) {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)

  const filtered = ASTANA_CLINICS.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.address.toLowerCase().includes(search.toLowerCase()) ||
    c.district.toLowerCase().includes(search.toLowerCase())
  )

  const selected = ASTANA_CLINICS.find(c => c.name === value)

  return (
    <div className="relative">
      <div
        className="input-field flex items-center justify-between cursor-pointer"
        onClick={() => setOpen(o => !o)}
      >
        {selected
          ? <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-800 text-sm truncate">{selected.name}</p>
              <p className="text-xs text-primary-400 truncate">{selected.address}</p>
            </div>
          : <span className="text-primary-300 text-sm">{value || 'Выберите или введите название'}</span>
        }
        <span className="ml-2 text-primary-400 flex-none">{open ? '▲' : '▼'}</span>
      </div>

      {open && (
        <div className="absolute z-30 left-0 right-0 mt-1 bg-white rounded-2xl overflow-hidden"
          style={{ maxHeight: 320, boxShadow: '0 20px 60px rgba(124,58,237,0.25)', border: '1px solid rgba(196,181,253,0.4)' }}>
          <div className="p-3 border-b border-primary-50">
            <input
              autoFocus
              className="w-full bg-primary-50 rounded-xl px-3 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-primary-300 placeholder-primary-300"
              placeholder="🔍 Поиск по названию, адресу, району..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onClick={e => e.stopPropagation()}
            />
          </div>
          <div className="overflow-y-auto" style={{ maxHeight: 240 }}>
            {search && !filtered.find(c => c.name.toLowerCase() === search.toLowerCase()) && (
              <button
                className="w-full text-left px-4 py-3 hover:bg-primary-50 border-b border-primary-50"
                onClick={() => { onChange(search); setOpen(false); setSearch('') }}>
                <p className="text-sm font-semibold text-primary-600">✏️ Ввести вручную: «{search}»</p>
              </button>
            )}
            {filtered.length === 0 && (
              <p className="text-center text-gray-400 py-4 text-sm">Ничего не найдено</p>
            )}
            {filtered.map(c => (
              <button key={c.name}
                className={`w-full text-left px-4 py-3 hover:bg-primary-50 transition-colors border-b border-primary-50 last:border-0 ${value === c.name ? 'bg-primary-50' : ''}`}
                onClick={() => { onChange(c.name); setOpen(false); setSearch('') }}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-800">{c.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">📍 {c.address}</p>
                  </div>
                  <span className="text-[10px] font-bold text-primary-500 bg-primary-50 px-2 py-0.5 rounded-lg flex-none mt-0.5">{c.district}</span>
                </div>
                {c.phone && <p className="text-xs text-primary-400 mt-0.5">📞 {c.phone}</p>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
