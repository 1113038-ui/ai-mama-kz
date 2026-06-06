import { useState, useRef, useCallback, useEffect } from 'react'
import { createWorker } from 'tesseract.js'
import { getAnalyses, setAnalyses } from '../utils/storage'
import { saveFile, getFilesByCategory, deleteFile } from '../utils/fileStorage'
import FileViewer from './FileViewer'

// ─── helpers ────────────────────────────────────────────────────────────────

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' Б'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' КБ'
  return (bytes / 1024 / 1024).toFixed(1) + ' МБ'
}

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
  const isUzi = /узи|ультразвук|бпр|дб|чсс|плацент/i.test(text)
  const type = isUzi ? 'УЗИ' : 'Анализ'
  const rows = []

  if (isUzi) {
    const uziRe = /([А-ЯЁA-Z]{2,6})\s+([\d.,]+)\s*(мм|см|уд\/мин|нед|дней)?/gi
    let m
    while ((m = uziRe.exec(text)) !== null) {
      rows.push({ parameter: m[1], value: m[2], unit: m[3] || '', norm: '' })
    }
  } else {
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

const typeColor = {
  'Анализ': 'bg-violet-100 text-violet-700',
  'УЗИ': 'bg-blue-100 text-blue-700',
  'Документ': 'bg-gray-100 text-gray-600'
}

// ─── main component ──────────────────────────────────────────────────────────

export default function DocumentUpload() {
  const [documents, setDocumentsState] = useState([])
  const [dragging, setDragging] = useState(false)
  const [currentFile, setCurrentFile] = useState(null) // { file, thumbnail }
  const [ocrState, setOcrState] = useState(null) // null | 'loading' | 'done' | 'error'
  const [ocrProgress, setOcrProgress] = useState(0)
  const [ocrText, setOcrText] = useState('')
  const [thumbnail, setThumbnail] = useState(null)
  const [extracted, setExtracted] = useState(null)
  const [confirmForm, setConfirmForm] = useState([])
  const [docType, setDocType] = useState('Документ')
  const [viewDoc, setViewDoc] = useState(null)
  const fileRef = useRef()

  // Load documents from IndexedDB on mount
  useEffect(() => {
    getFilesByCategory('document').then(files => {
      setDocumentsState(files.sort((a, b) => b.uploadedAt - a.uploadedAt))
    })
  }, [])

  const reloadDocs = () => {
    getFilesByCategory('document').then(files => {
      setDocumentsState(files.sort((a, b) => b.uploadedAt - a.uploadedAt))
    })
  }

  const handleFile = useCallback(async (file) => {
    if (!file) return
    setCurrentFile(file)
    setOcrText('')
    setThumbnail(null)
    setExtracted(null)
    setOcrState(null)

    let thumb = null
    try {
      if (file.type === 'application/pdf') {
        const buf = await file.arrayBuffer()
        const canvas = await pdfToCanvas(buf)
        thumb = await resizeImage(canvas.toDataURL('image/jpeg', 0.9))
      } else {
        thumb = await resizeImage(file)
      }
      setThumbnail(thumb)
    } catch (err) {
      console.error(err)
    }
  }, [])

  const runOcr = async () => {
    if (!currentFile) return
    setOcrState('loading')
    setOcrProgress(0)

    let imageSource = currentFile
    try {
      if (currentFile.type === 'application/pdf') {
        const buf = await currentFile.arrayBuffer()
        const canvas = await pdfToCanvas(buf)
        imageSource = await new Promise(res => canvas.toBlob(res, 'image/jpeg', 0.9))
      }

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
  }

  const onDrop = useCallback(e => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const saveAsAnalysis = async () => {
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
    await saveDocument('Анализ')
    alert(`Сохранено ${newEntries.length} показателей в анализы`)
  }

  const saveDocument = async (type = docType) => {
    if (!currentFile) return
    const id = Date.now()
    const fileObj = {
      id,
      name: currentFile.name,
      type: currentFile.type,
      size: currentFile.size,
      blob: currentFile,
      uploadedAt: Date.now(),
      category: 'document',
      docType: type,
      thumbnail,
      ocrText,
      extracted: confirmForm
    }
    await saveFile(fileObj)
    reloadDocs()
    resetUpload()
  }

  const deleteDoc = async (id) => {
    await deleteFile(id)
    reloadDocs()
  }

  const resetUpload = () => {
    setCurrentFile(null)
    setOcrState(null)
    setOcrProgress(0)
    setOcrText('')
    setThumbnail(null)
    setExtracted(null)
    setConfirmForm([])
    setDocType('Документ')
  }

  const openDoc = async (doc) => {
    setViewDoc(doc)
  }

  const downloadDoc = (doc) => {
    const url = URL.createObjectURL(doc.blob)
    const a = document.createElement('a')
    a.href = url
    a.download = doc.name
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  return (
    <div className="space-y-5">
      {/* Upload zone */}
      {!currentFile && (
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

      {/* File selected preview */}
      {currentFile && !ocrState && (
        <div className="card space-y-4">
          <div className="flex gap-4 items-start">
            {thumbnail
              ? <img src={thumbnail} alt="preview" className="w-24 h-24 rounded-2xl object-cover border-2 border-violet-200 shadow" />
              : <div className="w-24 h-24 rounded-2xl bg-violet-50 flex items-center justify-center text-4xl">📄</div>
            }
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-800 truncate">{currentFile.name}</p>
              <p className="text-sm text-gray-400 mt-1">{formatSize(currentFile.size)}</p>
              <div className="flex items-center gap-2 mt-2">
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
            </div>
          </div>
          <div className="flex gap-3">
            <button
              className="flex-1 text-sm font-bold py-3 rounded-2xl text-white"
              style={{ background: 'linear-gradient(135deg,#7c3aed,#ec4899)' }}
              onClick={runOcr}
            >
              🔍 Распознать текст
            </button>
            <button
              className="flex-1 text-sm font-bold py-3 rounded-2xl border-2 border-violet-200 text-violet-700 hover:bg-violet-50 transition-all"
              onClick={() => saveDocument()}
            >
              Сохранить документ
            </button>
          </div>
          <button className="w-full text-xs text-gray-400 underline" onClick={resetUpload}>Отмена</button>
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
              style={{ width: `${ocrProgress}%`, background: 'linear-gradient(90deg,#7c3aed,#ec4899)' }}
            />
          </div>
        </div>
      )}

      {/* OCR Result */}
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

          <details className="card !p-0 overflow-hidden">
            <summary className="px-4 py-3 cursor-pointer text-sm font-bold text-gray-600 bg-gray-50 rounded-2xl">
              Распознанный текст (развернуть)
            </summary>
            <pre className="px-4 py-3 text-xs text-gray-500 overflow-x-auto whitespace-pre-wrap max-h-40">{ocrText || 'Текст не найден'}</pre>
          </details>

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

          <div className="flex gap-3">
            {(docType === 'Анализ' || docType === 'УЗИ') && confirmForm.length > 0 && (
              <button className="btn-primary flex-1 text-sm" onClick={saveAsAnalysis}>
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
          <button className="w-full text-xs text-gray-400 underline" onClick={resetUpload}>Отмена</button>
        </div>
      )}

      {ocrState === 'error' && (
        <div className="card text-center py-6 border border-red-100">
          <p className="text-3xl mb-2">⚠️</p>
          <p className="font-bold text-red-600">Не удалось распознать документ</p>
          <div className="flex gap-3 mt-3 justify-center">
            <button className="text-sm text-violet-600 underline" onClick={() => setOcrState(null)}>
              Сохранить без распознавания
            </button>
            <button className="text-sm text-gray-400 underline" onClick={resetUpload}>Отмена</button>
          </div>
        </div>
      )}

      {/* Documents list */}
      {documents.length > 0 && !currentFile && (
        <div className="space-y-3">
          <h3 className="font-black text-gray-800">Сохранённые документы ({documents.length})</h3>
          {documents.map(doc => (
            <div key={doc.id} className="card border border-violet-100">
              <div className="flex items-center gap-3">
                {doc.thumbnail
                  ? <img src={doc.thumbnail} alt="" className="w-14 h-14 rounded-xl object-cover border border-violet-100 flex-shrink-0" />
                  : <div className="w-14 h-14 rounded-xl bg-violet-50 flex items-center justify-center text-2xl flex-shrink-0">📄</div>
                }
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs font-black px-2 py-0.5 rounded-full ${typeColor[doc.docType] || typeColor['Документ']}`}>
                      {doc.docType || 'Документ'}
                    </span>
                    <span className="text-xs text-gray-400">{new Date(doc.uploadedAt).toLocaleDateString('ru-RU')}</span>
                  </div>
                  <p className="text-sm font-medium text-gray-700 mt-1 truncate">{doc.name}</p>
                  <p className="text-xs text-gray-400">{formatSize(doc.size)}</p>
                </div>
                <button
                  className="text-gray-300 hover:text-red-400 text-xl font-bold flex-shrink-0"
                  onClick={() => deleteDoc(doc.id)}
                >×</button>
              </div>
              <div className="flex gap-2 mt-3">
                <button
                  className="flex-1 text-xs font-bold py-2 rounded-xl border border-violet-200 text-violet-700 hover:bg-violet-50 transition-all"
                  onClick={() => openDoc(doc)}
                >
                  👁 Открыть
                </button>
                <button
                  className="flex-1 text-xs font-bold py-2 rounded-xl text-white"
                  style={{ background: 'linear-gradient(135deg,#7c3aed,#ec4899)' }}
                  onClick={() => downloadDoc(doc)}
                >
                  ⬇ Скачать
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {documents.length === 0 && !currentFile && (
        <div className="text-center py-8 text-gray-400">
          <p className="text-4xl mb-3">📂</p>
          <p className="font-medium">Нет сохранённых документов</p>
        </div>
      )}

      {/* FileViewer modal */}
      {viewDoc && <FileViewer file={viewDoc} onClose={() => setViewDoc(null)} />}
    </div>
  )
}
