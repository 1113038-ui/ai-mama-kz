export const getUser = () => {
  try { return JSON.parse(localStorage.getItem('aiMamaUser') || 'null') } catch { return null }
}
export const setUser = (data) => localStorage.setItem('aiMamaUser', JSON.stringify(data))

export const getMedications = () => {
  try { return JSON.parse(localStorage.getItem('aiMamaMeds') || '[]') } catch { return [] }
}
export const setMedications = (data) => localStorage.setItem('aiMamaMeds', JSON.stringify(data))

export const getMedLogs = () => {
  try { return JSON.parse(localStorage.getItem('aiMamaMedLogs') || '{}') } catch { return {} }
}
export const setMedLogs = (data) => localStorage.setItem('aiMamaMedLogs', JSON.stringify(data))

export const getVisits = () => {
  try { return JSON.parse(localStorage.getItem('aiMamaVisits') || '[]') } catch { return [] }
}
export const setVisits = (data) => localStorage.setItem('aiMamaVisits', JSON.stringify(data))

export const getAnalyses = () => {
  try { return JSON.parse(localStorage.getItem('aiMamaAnalyses') || '[]') } catch { return [] }
}
export const setAnalyses = (data) => localStorage.setItem('aiMamaAnalyses', JSON.stringify(data))

export const getPrescriptions = () => {
  try { return JSON.parse(localStorage.getItem('aiMamaPrescriptions') || '[]') } catch { return [] }
}
export const setPrescriptions = (data) => localStorage.setItem('aiMamaPrescriptions', JSON.stringify(data))

export const getDocuments = () => {
  try { return JSON.parse(localStorage.getItem('aiMamaDocuments') || '[]') } catch { return [] }
}
export const setDocuments = (d) => localStorage.setItem('aiMamaDocuments', JSON.stringify(d))

export const getBabyWeightByWeek = (week) => {
  const weights = {
    8: '1г', 10: '4г', 12: '14г', 14: '43г', 16: '100г', 18: '190г',
    20: '300г', 22: '430г', 24: '600г', 26: '760г', 28: '1кг',
    30: '1.3кг', 32: '1.7кг', 34: '2.1кг', 36: '2.6кг', 38: '3кг',
    40: '3.4кг'
  }
  const weeks = Object.keys(weights).map(Number)
  const closest = weeks.reduce((prev, curr) => Math.abs(curr - week) < Math.abs(prev - week) ? curr : prev)
  return weights[closest] || '—'
}
