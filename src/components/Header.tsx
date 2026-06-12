import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthContext'

export default function Header() {
  const { user } = useAuth()
  const { pathname } = useLocation()

  const isSubmit = pathname === '/submit'
  const isAuth = pathname === '/auth' || pathname === '/my'

  return (
    <header className="shrink-0 sticky top-0 z-[1000] bg-zinc-950/90 backdrop-blur border-b border-zinc-800">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-2">
        <Link to="/" className="text-xl font-display font-bold text-amber-400 shrink-0 mr-2">
          FindComedy
        </Link>

        <nav className="flex gap-1 ml-auto text-sm items-center">
          {/* Browse tab */}
          <Link
            to="/"
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              !isSubmit && !isAuth
                ? 'bg-zinc-800 text-white'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Browse
          </Link>

          {/* Submit tab */}
          <Link
            to="/submit"
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              isSubmit
                ? 'bg-zinc-800 text-white'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Submit
          </Link>

          {/* Auth-aware 3rd tab */}
          {user ? (
            <Link
              to="/my"
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                pathname === '/my'
                  ? 'bg-amber-400 text-zinc-950'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              My nights
            </Link>
          ) : (
            <Link
              to="/auth"
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                pathname === '/auth'
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}
