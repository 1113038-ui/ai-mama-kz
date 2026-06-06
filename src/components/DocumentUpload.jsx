import { useState, useRef, useCallback } from 'react'
import { createWorker } from 'tesseract.js'
import { getDocuments, setDocuments, getAnalyses, setAnalyses } from '../utils/storage'

// ─── helpers ────────────────────────────────────────────────────────────────

async function resizeImage(source, maxSize = 200) {
  return new Promise(resolve => {
    const img = new Image()
    img.onload = () => {
      const ratio = Math.min(maxSize / img.width, maxSize / img.height)
      const canvas = document.createElement('canvas')
      canvas.width = img.width * ratio
      canvas.height = img.height * ratio
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL('image/jpeg', 0.7))
    }
    img.src = typeof source === 'string' ? source : URL.createObjectURL(source)
  })
}

async function pdfToCanvas(arrayBuffer) {
  const pdfjsLib = await import('pdfjs-dist')
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
  const page = await pdf.getPage(1)
  const viewport = page.getViewport({ scale: 2 })
  const canvas = document.createElement('canvas')
  canvas.width = viewport.width
  canvas.height = viewport.height
  await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise
  return canvas
}

function extractAnalysisData(ocrText) {
  const text = ocrText || ''
  const lower = text.toLowerCase()

  // Detect type
  const isUzi = /узи|ультразвук|бпр|дб|чсс|плацент/i.test(text)
  const type = isUzi ? 'УЗИ' : 'Анализ'

  const rows = []

  if (isUzi) {
    // УЗИ patterns: "БПР 45 мм", "ДБ 32 мм", "ЧСС 150 уд/мин"
    const uziRe = /([А-ЯЁA-Z]{2,6})\s+([\d.,]+)\s*(мм|см|уд\/мин|нед|дней)?/gi
    let m
    while ((m = uziRe.exec(text)) !== null) {
      rows.push({ parameter: m[1], value: m[2], unit: m[3] || '', norm: '' })
    }
  } else {
    // Analysis patterns: "Гемоглобин 120 г/л", "Глюкоза 4.5 ммоль/л"
    const analysisRe =
      /([А-ЯЁа-яёa-zA-Z][А-ЯЁа-яё\w\s-]{2,25})\s+([\d.,]+)\s*(г\/л|ммоль\/л|\*10\^9|мкмоль\/л|%|мг\/л|МЕ\/л|мкг\/л|ед\/л)?/gi
    let m
    while ((m = analysisRe.exec(text)) !== null) {
      const name = m[1].trim()
      if (name.split(' ').length <= 4) {
        rows.push({ name, value: m[2], unit: m[3] || '', reference: '' })
      }
    }
  }

  return { type, rows: rows.slice(0, 20) }
}

// ─── main component ──────────────────────────────────────────────────────────

export default function DocumentUpload() {
  const [documents, setDocumentsState] = useState(getDocuments())
  const [dragging, setDragging] = useState(false)
  const [ocrState, setOcrState] = useState(null) // null | 'loading' | 'done'
  const [ocrProgress, setOcrProgress] = useState(0)
  const [ocrText, setOcrText] = useState('')
  const [thumbnail, setThumbnail] = useState(null)
  const [extracted, setExtracted] = useState(null)
  const [confirmForm, setConfirmForm] = useState([])
  const [docType, setDocType] = useState('Документ')
  const [viewDoc, setViewDoc] = useState(null)
  const fileRef = useRef()

  const handleFile = useCallback(async (file) => {
    if (!file) return
    setOcrState('loading')
    setOcrProgress(0)
    setOcrText('')
    setThumbnail(null)
    setExtracted(null)

    let imageSource = file
    let thumb = null

    try {
      if (file.type === 'application/pdf') {
        const buf = await file.arrayBuffer()
        const canvas = await pdfToCanvas(buf)
        thumb = await resizeImage(canvas.toDataURL('image/jpeg', 0.9))
        // Convert canvas to blob for Tesseract
        imageSource = await new Promise(res => canvas.toBlob(res, 'image/jpeg', 0.9))
      } else {
        thumb = await resizeImage(file)
      }
      setThumbnail(thumb)

      const worker = await createWorker('rus+eng', 1, {
        logger: m => {
          if (m.status === 'recognizing text') {
            setOcrProgress(Math.round(m.progress * 100))
          }
        }
      })
      const { data: { text } } = await worker.recognize(imageSource)
      await worker.terminate()

      setOcrText(text)
      const result = extractAnalysisData(text)
      setExtracted(result)
      setDocType(result.type)
      setConfirmForm(result.rows)
      setOcrState('done')
    } catch (err) {
      console.error(err)
      setOcrState('error')
    }
  }, [])

  const onDrop = useCallback(e => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const saveAsAnalysis = () => {
    const analyses = getAnalyses()
    const today = new Date().toISOString().slice(0, 10)
    const newEntries = confirmForm
      .filter(r => r.value)
      .map(r => ({
        id: Date.now() + Math.random(),
        name: r.name || r.parameter || 'Параметр',
        date: today,
        result: `${r.value} ${r.unit || ''}`.trim(),
        reference: r.reference || r.norm || ''
      }))
    setAnalyses([...analyses, ...newEntries])
    saveDocument('Анализ')
    alert(`Сохранено ${newEntries.length} показателей в анализы`)
  }

  const saveDocument = (type = docType) => {
    const docs = getDocuments()
    const doc = {
      id: Date.now(),
      date: new Date().toISOString().slice(0, 10),
      type,
      thumbnail,
      ocrText,
      extracted: confirmForm
    }
    const updated = [doc, ...docs]
    setDocuments(updated)
    setDocumentsState(updated)
    resetUpload()
  }

  const deleteDoc = (id) => {
    const updated = documents.filter(d => d.id !== id)
    setDocuments(updated)
    setDocumentsState(updated)
  }

  const resetUpload = () => {
    setOcrState(null)
    setOcrProgress(0)
    setOcrText('')
    setThumbnail(null)
    setExtracted(null)
    setConfirmForm([])
  }

  const typeColor = {
    'Анализ': 'bg-violet-100 text-violet-700',
    'УЗИ': 'bg-blue-100 text-blue-700',
    'Документ': 'bg-gray-100 text-gray-600'
  }

  return (
    <div className="space-y-5">
      {/* Upload zone */}
      {!ocrState && (
        <div
          className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all
            ${dragging
              ? 'border-pink-400 bg-pink-50 scale-[1.01]'
              : 'border-violet-300 bg-gradient-to-br from-violet-50 to-pink-50 hover:border-violet-400'}`}
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => fileRef.current.click()}
        >
          <div className="text-5xl mb-3">📎</div>
          <p className="font-black text-gray-800 text-lg">Загрузите документ</p>
          <p className="text-sm text-gray-400 mt-1">Фото, скан или PDF · перетащите или нажмите</p>
          <div className="mt-4 inline-flex gap-2">
            <span className="text-xs bg-violet-100 text-violet-700 px-3 py-1 rounded-full font-semibold">JPG/PNG</span>
            <span className="text-xs bg-pink-100 text-pink-700 px-3 py-1 rounded-full font-semibold">PDF</span>
          </div>
          <input
            ref={fileRef}
            type="file"
            className="hidden"
            accept="image/*,.pdf"
            onChange={e => handleFile(e.target.files[0])}
          />
        </div>
      )}

      {/* OCR Loading */}
      {ocrState === 'loading' && (
        <div className="card text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#ec4899)' }}>
            <svg className="animate-spin w-8 h-8 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
            </svg>
          </div>
          <p className="font-black text-gray-800">Распознаём документ...</p>
          <p className="text-2xl font-black text-violet-600 mt-1">{ocrProgress}%</p>
          <div className="mt-4 h-3 bg-gray-100 rounded-full overflow-hidden mx-4">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${ocrProgress}%`,
                background: 'linear-gradient(90deg,#7c3aed,#ec4899)'
              }}
            />
          </div>
        </div>
      )}

      {/* Result */}
      {ocrState === 'done' && extracted && (
        <div className="space-y-4">
          <div className="flex gap-4 items-start">
            {thumbnail && (
              <img src={thumbnail} alt="doc" className="w-24 h-24 rounded-2xl object-cover border-2 border-violet-200 shadow" />
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-xs font-black px-3 py-1 rounded-full ${typeColor[docType] || typeColor['Документ']}`}>
                  {docType}
                </span>
                <select
                  className="text-xs border border-gray-200 rounded-xl px-2 py-1 text-gray-600"
                  value={docType}
                  onChange={e => setDocType(e.target.value)}
                >
                  <option>Анализ</option>
                  <option>УЗИ</option>
                  <option>Документ</option>
                </select>
              </div>
              <p className="text-xs text-gray-400 font-medium">Найдено показателей: {confirmForm.length}</p>
            </div>
          </div>

          {/* OCR text */}
          <details className="card !p-0 overflow-hidden">
            <summary className="px-4 py-3 cursor-pointer text-sm font-bold text-gray-600 bg-gray-50 rounded-2xl">
              Распознанный текст (развернуть)
            </summary>
            <pre className="px-4 py-3 text-xs text-gray-500 overflow-x-auto whitespace-pre-wrap max-h-40">{ocrText || 'Текст не найден'}</pre>
          </details>

          {/* Editable extracted fields */}
          {confirmForm.length > 0 && (
            <div className="card space-y-3">
              <h3 className="font-black text-gray-800">Извлечённые данные</h3>
              {confirmForm.map((row, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input
                    className="input-field flex-1 !py-2 text-sm"
                    placeholder="Название"
                    value={row.name || row.parameter || ''}
                    onChange={e => {
                      const updated = [...confirmForm]
                      updated[i] = { ...updated[i], name: e.target.value, parameter: e.target.value }
                      setConfirmForm(updated)
                    }}
                  />
                  <input
                    className="input-field w-20 !py-2 text-sm"
                    placeholder="Знач."
                    value={row.value || ''}
                    onChange={e => {
                      const updated = [...confirmForm]
                      updated[i] = { ...updated[i], value: e.target.value }
                      setConfirmForm(updated)
                    }}
                  />
                  <input
                    className="input-field w-20 !py-2 text-sm"
                    placeholder="Ед."
                    value={row.unit || ''}
                    onChange={e => {
                      const updated = [...confirmForm]
                      updated[i] = { ...updated[i], unit: e.target.value }
                      setConfirmForm(updated)
                    }}
                  />
                  <button
                    className="text-gray-300 hover:text-red-400 text-lg font-bold"
                    onClick={() => setConfirmForm(confirmForm.filter((_, j) => j !== i))}
                  >×</button>
                </div>
              ))}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3">
            {(docType === 'Анализ' || docType === 'УЗИ') && confirmForm.length > 0 && (
              <button
                className="btn-primary flex-1 text-sm"
                onClick={saveAsAnalysis}
              >
                Сохранить в карту
              </button>
            )}
            <button
              className="flex-1 text-sm font-bold py-3 rounded-2xl border-2 border-violet-200 text-violet-700 hover:bg-violet-50 transition-all"
              onClick={() => saveDocument()}
            >
              Сохранить документ
            </button>
          </div>
          <button
            className="w-full text-xs text-gray-400 underline"
            onClick={resetUpload}
          >
            Отмена
          </button>
        </div>
      )}

      {ocrState === 'error' && (
        <div className="card text-center py-6 border border-red-100">
          <p className="text-3xl mb-2">⚠️</p>
          <p className="font-bold text-red-600">Не удалось распознать документ</p>
          <button className="mt-3 text-sm text-violet-600 underline" onClick={resetUpload}>Попробовать снова</button>
        </div>
      )}

      {/* Documents list */}
      {documents.length > 0 && !ocrState && (
        <div className="space-y-3">
          <h3 className="font-black text-gray-800">Сохранённые документы ({documents.length})</h3>
          {documents.map(doc => (
            <div key={doc.id} className="card flex items-center gap-3">
              {doc.thumbnail
                ? <img src={doc.thumbnail} alt="" className="w-14 h-14 rounded-xl object-cover border border-violet-100 cursor-pointer flex-shrink-0"
                    onClick={() => setViewDoc(doc)} />
                : <div className="w-14 h-14 rounded-xl bg-violet-50 flex items-center justify-center text-2xl flex-shrink-0 cursor-pointer"
                    onClick={() => setViewDoc(doc)}>📄</div>
              }
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs font-black px-2 py-0.5 rounded-full ${typeColor[doc.type] || typeColor['Документ']}`}>
                    {doc.type}
                  </span>
                  <span className="text-xs text-gray-400">{doc.date}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1 truncate">
                  {doc.extracted?.length > 0
                    ? `${doc.extracted.length} показателей`
                    : 'Документ без распознавания'}
                </p>
              </div>
              <button
                className="text-gray-300 hover:text-red-400 text-xl font-bold flex-shrink-0"
                onClick={() => deleteDoc(doc.id)}
              >×</button>
            </div>
          ))}
        </div>
      )}

      {/* View modal */}
      {viewDoc && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ background: 'rgba(30,10,60,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={() => setViewDoc(null)}
        >
          <div
            className="bg-white rounded-t-3xl w-full max-w-lg p-6 pb-10 max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-black px-3 py-1 rounded-full ${typeColor[viewDoc.type] || typeColor['Документ']}`}>
                  {viewDoc.type}
                </span>
                <span className="text-sm text-gray-400">{viewDoc.date}</span>
              </div>
              <button onClick={() => setViewDoc(null)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold">×</button>
            </div>
            {viewDoc.thumbnail && (
              <img src={viewDoc.thumbnail} alt="" className="w-full rounded-2xl mb-4 border border-violet-100" />
            )}
            {viewDoc.ocrText && (
              <pre className="text-xs text-gray-500 bg-gray-50 rounded-2xl p-4 whitespace-pre-wrap max-h-60 overflow-y-auto">
                {viewDoc.ocrText}
              </pre>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
