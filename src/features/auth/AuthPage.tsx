import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'

type Step = 'email' | 'otp'

export default function AuthPage() {
  const { user, isLoading, signInWithEmail, verifyOtp, signInWithGoogle, isConfigured } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoading && user) navigate('/my', { replace: true })
  }, [user, isLoading, navigate])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!isConfigured) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-zinc-400 text-sm">
          Authentication requires Supabase — add <code className="text-amber-300">VITE_SUPABASE_URL</code> and{' '}
          <code className="text-amber-300">VITE_SUPABASE_ANON_KEY</code> to your <code className="text-amber-300">.env</code>.
        </p>
        <Link to="/" className="text-amber-400 text-sm hover:underline">Back to browse</Link>
      </div>
    )
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await signInWithEmail(email)
      setStep('otp')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleOtpSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await verifyOtp(email, otp)
      navigate('/my', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid or expired code')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleGoogle() {
    setError(null)
    try {
      await signInWithGoogle()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed')
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm flex flex-col gap-6">
        {/* Logo */}
        <div className="text-center">
          <Link to="/" className="text-2xl font-display font-bold text-amber-400">FindComedy</Link>
          <p className="text-zinc-400 text-sm mt-1">Sign in to save nights and say you're going</p>
        </div>

        {/* Email step */}
        {step === 'email' ? (
          <form onSubmit={handleEmailSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-xs text-zinc-400 uppercase tracking-widest">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="bg-amber-400 text-zinc-950 font-semibold px-4 py-3 rounded-xl hover:bg-amber-300 disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Sending…' : 'Send code'}
            </button>
          </form>
        ) : (
          /* OTP step */
          <form onSubmit={handleOtpSubmit} className="flex flex-col gap-4">
            <p className="text-sm text-zinc-400">
              We sent a 6-digit code to <span className="text-white font-medium">{email}</span>
            </p>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="otp" className="text-xs text-zinc-400 uppercase tracking-widest">
                Code
              </label>
              <input
                id="otp"
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                required
                maxLength={6}
                className="bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-400 tracking-[0.4em] text-center text-lg"
              />
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={submitting || otp.length !== 6}
              className="bg-amber-400 text-zinc-950 font-semibold px-4 py-3 rounded-xl hover:bg-amber-300 disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Verifying…' : 'Verify'}
            </button>
            <button
              type="button"
              onClick={() => { setStep('email'); setOtp(''); setError(null) }}
              className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Use a different email
            </button>
          </form>
        )}

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-zinc-800" />
          <span className="text-xs text-zinc-600">or</span>
          <div className="flex-1 h-px bg-zinc-800" />
        </div>

        {/* Google */}
        <button
          onClick={handleGoogle}
          className="flex items-center justify-center gap-3 bg-zinc-900 ring-1 ring-zinc-700 px-4 py-3 rounded-xl hover:bg-zinc-800 transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          <span className="text-sm text-zinc-200">Continue with Google</span>
        </button>

        <p className="text-center text-xs text-zinc-600">
          <Link to="/" className="hover:text-zinc-400 transition-colors">Back to browsing</Link>
        </p>
      </div>
    </div>
  )
}
