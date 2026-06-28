import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import BrowsePage from './features/browse/BrowsePage'

// Homepage (BrowsePage) stays eager for fast LCP; everything else is split out of the
// main bundle and loaded on navigation.
const NightDetailPage = lazy(() => import('./features/night/NightDetailPage'))
const AuthPage = lazy(() => import('./features/auth/AuthPage'))
const MyNightsPage = lazy(() => import('./features/my/MyNightsPage'))
const SubmitPage = lazy(() => import('./features/submit/SubmitPage'))
const AdminDashboard = lazy(() => import('./features/admin/AdminDashboard'))
const AdminNightEdit = lazy(() => import('./features/admin/AdminNightEdit'))
const AdminSubmissions = lazy(() => import('./features/admin/AdminSubmissions'))
const AdminFeedback = lazy(() => import('./features/admin/AdminFeedback'))
const AdminSubmissionReview = lazy(() => import('./features/admin/AdminSubmissionReview'))
const AdminUsers = lazy(() => import('./features/admin/AdminUsers'))
const AreaPage = lazy(() => import('./features/area/AreaPage'))
const AreasIndexPage = lazy(() => import('./features/area/AreasIndexPage'))

export default function App() {
  return (
    <Suspense fallback={null}>
      <Routes>
        <Route path="/" element={<BrowsePage />} />
        <Route path="/comedy" element={<AreasIndexPage />} />
        <Route path="/comedy/:areaSlug" element={<AreaPage />} />
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
    </Suspense>
  )
}
