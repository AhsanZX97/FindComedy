import { Routes, Route } from 'react-router-dom'
import HomePage from './features/home/HomePage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
    </Routes>
  )
}
