import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import 'leaflet/dist/leaflet.css'
import './index.css'
import App from './App'
import { AuthProvider } from './features/auth/AuthContext'
import { SocialProvider } from './features/social/SocialContext'
import { ThemeProvider } from './context/ThemeContext'

const rootEl = document.getElementById('root')
if (!rootEl) throw new Error('Root element not found')

createRoot(rootEl).render(
  <StrictMode>
    <HashRouter>
      <ThemeProvider>
        <AuthProvider>
          <SocialProvider>
            <App />
          </SocialProvider>
        </AuthProvider>
      </ThemeProvider>
      <Analytics />
    </HashRouter>
  </StrictMode>,
)
