import { useState, useRef, useEffect } from 'react'

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
  const [inputVal, setInputVal] = useState(value || '')
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)

  // sync if parent changes value
  useEffect(() => { setInputVal(value || '') }, [value])

  // close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filtered = ASTANA_CLINICS.filter(c =>
    inputVal.length === 0 ||
    c.name.toLowerCase().includes(inputVal.toLowerCase()) ||
    c.address.toLowerCase().includes(inputVal.toLowerCase()) ||
    c.district.toLowerCase().includes(inputVal.toLowerCase())
  )

  const selected = ASTANA_CLINICS.find(c => c.name === value)

  const handleInput = (e) => {
    setInputVal(e.target.value)
    onChange(e.target.value)
    setOpen(true)
  }

  const handleSelect = (c) => {
    setInputVal(c.name)
    onChange(c.name)
    setOpen(false)
  }

  return (
    <div className="relative" ref={wrapRef}>
      {/* Input field — type directly */}
      <div className="relative">
        <input
          className="input-field pr-10"
          placeholder="Введите цифру, букву или район..."
          value={inputVal}
          onChange={handleInput}
          onFocus={() => setOpen(true)}
        />
        <button
          className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-400 text-sm"
          onClick={() => setOpen(o => !o)}
          tabIndex={-1}
        >{open ? '▲' : '▼'}</button>
      </div>

      {/* Selected clinic info */}
      {selected && selected.name === value && (
        <div className="mt-1.5 px-3 py-2 rounded-xl bg-primary-50 flex items-center gap-2">
          <span className="text-primary-500 text-sm">📍</span>
          <div>
            <p className="text-xs text-gray-500">{selected.address}</p>
            {selected.phone && <p className="text-xs text-primary-400">📞 {selected.phone}</p>}
          </div>
          <span className="ml-auto text-[10px] font-bold text-primary-500 bg-white px-2 py-0.5 rounded-lg">{selected.district}</span>
        </div>
      )}

      {/* Dropdown list */}
      {open && (
        <div className="absolute z-30 left-0 right-0 mt-1 bg-white rounded-2xl overflow-hidden"
          style={{ maxHeight: 280, boxShadow: '0 20px 60px rgba(124,58,237,0.25)', border: '1px solid rgba(196,181,253,0.4)' }}>
          <div className="overflow-y-auto" style={{ maxHeight: 280 }}>
            {filtered.length === 0 && (
              <div className="text-center py-4">
                <p className="text-gray-400 text-sm">Не найдено в списке</p>
                <p className="text-primary-400 text-xs mt-1">Ваш текст сохранится как введено</p>
              </div>
            )}
            {filtered.map(c => (
              <button key={c.name}
                className={`w-full text-left px-4 py-3 hover:bg-primary-50 transition-colors border-b border-primary-50 last:border-0 ${value === c.name ? 'bg-primary-50' : ''}`}
                onMouseDown={e => { e.preventDefault(); handleSelect(c) }}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-800">{c.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">📍 {c.address}</p>
                    {c.phone && <p className="text-xs text-primary-400">📞 {c.phone}</p>}
                  </div>
                  <span className="text-[10px] font-bold text-primary-500 bg-primary-50 px-2 py-0.5 rounded-lg flex-none mt-0.5">{c.district}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
