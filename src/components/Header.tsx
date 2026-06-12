import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthContext'
import { useTheme } from '../context/ThemeContext'
import FeedbackModal from './FeedbackModal'

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
}

export default function Header() {
  const { user, isAdmin, signOut } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [feedbackOpen, setFeedbackOpen] = useState(false)

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  const isSubmit = pathname === '/submit'
  const isAuth = pathname === '/auth' || pathname === '/my'
  const isAdminRoute = pathname.startsWith('/admin')

  return (
    <header className="shrink-0 sticky top-0 z-[1000] bg-white dark:bg-zinc-950 border-b border-gray-200 dark:border-zinc-800">
      <div className="w-full px-4 py-3 flex items-center gap-2">
        <Link to="/" className="text-xl font-display font-bold text-amber-500 shrink-0 mr-2">
          FindComedy
        </Link>

        <nav className="flex gap-1 ml-auto text-sm items-center">
          <Link
            to="/"
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              !isSubmit && !isAuth
                ? 'bg-gray-900 text-white dark:bg-zinc-200 dark:text-zinc-900'
                : 'text-gray-500 hover:text-gray-800 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            Browse
          </Link>

          <Link
            to="/submit"
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              isSubmit
                ? 'bg-gray-900 text-white dark:bg-zinc-200 dark:text-zinc-900'
                : 'text-gray-500 hover:text-gray-800 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            Submit
          </Link>

          {user ? (
            <Link
              to="/my"
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                pathname === '/my'
                  ? 'bg-amber-500 text-white'
                  : 'text-gray-500 hover:text-gray-800 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
            >
              My nights
            </Link>
          ) : (
            <Link
              to="/auth"
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                pathname === '/auth'
                  ? 'bg-gray-900 text-white dark:bg-zinc-200 dark:text-zinc-900'
                  : 'text-gray-500 hover:text-gray-800 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
            >
              Sign in
            </Link>
          )}

          {isAdmin && (
            <Link
              to="/admin"
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                isAdminRoute
                  ? 'bg-amber-500 text-white'
                  : 'text-gray-500 hover:text-gray-800 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
            >
              Admin
            </Link>
          )}

          {user && (
            <button
              onClick={() => void handleSignOut()}
              className="ml-1 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-500 hover:text-gray-800 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
            >
              Sign out
            </button>
          )}

          <button
            onClick={() => setFeedbackOpen(true)}
            className="ml-1 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-500 hover:text-gray-800 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
          >
            Feedback
          </button>

          <button
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="ml-1 p-2 rounded-lg text-gray-500 hover:text-gray-800 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
          >
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>
        </nav>
      </div>

      {feedbackOpen && <FeedbackModal onClose={() => setFeedbackOpen(false)} />}
    </header>
  )
}
