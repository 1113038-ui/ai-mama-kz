import { useState, useEffect } from 'react'

export default function FileViewer({ file, onClose }) {
  const [url, setUrl] = useState(null)

  useEffect(() => {
    let objectUrl = null
    if (file?.blob) {
      objectUrl = URL.createObjectURL(file.blob)
      setUrl(objectUrl)
    }
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [file])

  if (!file) return null

  const isPdf = file?.type === 'application/pdf'

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: 'rgba(0,0,0,0.92)' }}>
      <div className="flex items-center justify-between p-4 text-white">
        <span className="font-bold truncate max-w-[60vw]">{file?.name}</span>
        <div className="flex gap-3 items-center">
          {url && (
            <a
              href={url}
              download={file?.name}
              className="text-xs font-bold px-3 py-2 rounded-xl text-white"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #ec4899)' }}
            >
              ⬇ Скачать
            </a>
          )}
          <button onClick={onClose} className="text-3xl leading-none text-white font-bold">×</button>
        </div>
      </div>
      <div className="flex-1 overflow-auto flex items-center justify-center p-4">
        {!url && (
          <p className="text-gray-400">Загрузка...</p>
        )}
        {url && isPdf && (
          <iframe src={url} className="w-full h-full rounded-xl" title={file?.name} style={{ minHeight: '70vh' }} />
        )}
        {url && !isPdf && (
          <img src={url} alt={file?.name} className="max-w-full max-h-full rounded-xl object-contain" />
        )}
      </div>
    </div>
  )
}
