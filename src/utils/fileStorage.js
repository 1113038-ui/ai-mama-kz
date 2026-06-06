import { openDB } from 'idb'

const DB_NAME = 'aiMamaFiles'
const DB_VERSION = 1

async function getDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('files')) {
        db.createObjectStore('files', { keyPath: 'id' })
      }
    }
  })
}

export async function saveFile(fileObj) {
  // fileObj: { id, name, type, size, blob, uploadedAt, category, analysisId? }
  const db = await getDB()
  await db.put('files', fileObj)
}

export async function getFile(id) {
  const db = await getDB()
  return db.get('files', id)
}

export async function getAllFiles() {
  const db = await getDB()
  return db.getAll('files')
}

export async function deleteFile(id) {
  const db = await getDB()
  await db.delete('files', id)
}

export async function getFilesByCategory(category) {
  const db = await getDB()
  const all = await db.getAll('files')
  return all.filter(f => f.category === category)
}

export async function getFilesByAnalysis(analysisId) {
  const db = await getDB()
  const all = await db.getAll('files')
  return all.filter(f => f.analysisId === analysisId)
}
