import { Routes, Route, Navigate } from 'react-router-dom'
import BrowsePage from './features/browse/BrowsePage'
import NightDetailPage from './features/night/NightDetailPage'
import AuthPage from './features/auth/AuthPage'
import MyNightsPage from './features/my/MyNightsPage'
import SubmitPage from './features/submit/SubmitPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<BrowsePage />} />
      <Route path="/tonight" element={<Navigate to="/" replace />} />
      <Route path="/map" element={<Navigate to="/" replace />} />
      <Route path="/night/:id" element={<NightDetailPage />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/my" element={<MyNightsPage />} />
      <Route path="/submit" element={<SubmitPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
