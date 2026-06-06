import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Onboarding from './pages/Onboarding'
import Dashboard from './pages/Dashboard'
import MedCard from './pages/MedCard'
import MedTracker from './pages/MedTracker'
import Benefits from './pages/Benefits'

function App() {
  const userData = localStorage.getItem('aiMamaUser')

  return (
    <BrowserRouter basename="/ai-mama-kz">
      <Routes>
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/medcard" element={<MedCard />} />
        <Route path="/tracker" element={<MedTracker />} />
        <Route path="/benefits" element={<Benefits />} />
        <Route path="*" element={<Navigate to={userData ? '/dashboard' : '/onboarding'} replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
