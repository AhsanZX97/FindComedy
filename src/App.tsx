import { Routes, Route, Navigate } from 'react-router-dom'
import BrowsePage from './features/browse/BrowsePage'
import NightDetailPage from './features/night/NightDetailPage'
import MapPage from './features/map/MapPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<BrowsePage key="browse" />} />
      <Route path="/tonight" element={<BrowsePage key="tonight" preset="tonight" />} />
      <Route path="/night/:id" element={<NightDetailPage />} />
      <Route path="/map" element={<MapPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
