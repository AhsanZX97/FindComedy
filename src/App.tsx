import { Routes, Route, Navigate } from 'react-router-dom'
import BrowsePage from './features/browse/BrowsePage'
import NightDetailPage from './features/night/NightDetailPage'
import AuthPage from './features/auth/AuthPage'
import MyNightsPage from './features/my/MyNightsPage'
import SubmitPage from './features/submit/SubmitPage'
import AdminDashboard from './features/admin/AdminDashboard'
import AdminNightEdit from './features/admin/AdminNightEdit'
import AdminSubmissions from './features/admin/AdminSubmissions'
import AdminFeedback from './features/admin/AdminFeedback'
import AdminSubmissionReview from './features/admin/AdminSubmissionReview'
import AdminUsers from './features/admin/AdminUsers'

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
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/admin/nights/:id" element={<AdminNightEdit />} />
      <Route path="/admin/queue" element={<AdminSubmissions />} />
      <Route path="/admin/queue/:id" element={<AdminSubmissionReview />} />
      <Route path="/admin/feedback" element={<AdminFeedback />} />
      <Route path="/admin/users" element={<AdminUsers />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
