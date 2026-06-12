import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import 'leaflet/dist/leaflet.css'
import './index.css'
import App from './App'
import { AuthProvider } from './features/auth/AuthContext'
import { SocialProvider } from './features/social/SocialContext'

const rootEl = document.getElementById('root')
if (!rootEl) throw new Error('Root element not found')

createRoot(rootEl).render(
  <StrictMode>
    <HashRouter>
      <AuthProvider>
        <SocialProvider>
          <App />
        </SocialProvider>
      </AuthProvider>
    </HashRouter>
  </StrictMode>,
)
