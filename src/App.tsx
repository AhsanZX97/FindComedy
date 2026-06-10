import { Routes, Route, Navigate } from 'react-router-dom'
import BrowsePage from './features/browse/BrowsePage'

function NightDetailPlaceholder() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center gap-4 px-4">
      <p className="text-zinc-400">Night detail pages are coming in Phase 2.</p>
      <a href="#/" className="text-amber-400 text-sm hover:underline">
        Back to browse
      </a>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<BrowsePage key="browse" />} />
      <Route path="/tonight" element={<BrowsePage key="tonight" preset="tonight" />} />
      <Route path="/night/:id" element={<NightDetailPlaceholder />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
