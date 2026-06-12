import { useState } from 'react'
import { submitFeedback } from '../services/feedbackService'

type Status = 'idle' | 'submitting' | 'done' | 'error'

interface FeedbackModalProps {
  onClose: () => void
}

function FeedbackModal({ onClose }: FeedbackModalProps) {
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<Status>('idle')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!message.trim()) return
    setStatus('submitting')
    try {
      await submitFeedback(message, email || undefined)
      setStatus('done')
    } catch {
      setStatus('error')
    }
  }

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-end sm:items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" aria-hidden onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900 ring-1 ring-gray-200 dark:ring-zinc-800 p-6 flex flex-col gap-4 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-display font-bold text-gray-900 dark:text-white">Send feedback</h2>
            <p className="text-sm text-gray-500 dark:text-zinc-400 mt-0.5">Suggestions, bugs, or anything on your mind.</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {status === 'done' ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <span className="text-2xl">✓</span>
            <p className="text-sm font-medium text-gray-700 dark:text-zinc-300">Thanks for the feedback!</p>
            <button
              onClick={onClose}
              className="mt-1 px-4 py-2 rounded-lg bg-gray-900 dark:bg-zinc-200 text-white dark:text-zinc-900 text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-zinc-300" htmlFor="fb-message">
                Message <span className="text-red-500">*</span>
              </label>
              <textarea
                id="fb-message"
                rows={4}
                placeholder="Any suggestions or issues?"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                className="rounded-xl bg-gray-50 dark:bg-zinc-800 ring-1 ring-gray-200 dark:ring-zinc-700 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-500 resize-none focus:outline-none focus:ring-amber-400 transition-shadow"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-zinc-300" htmlFor="fb-email">
                Email <span className="text-xs font-normal text-gray-400 dark:text-zinc-500">(optional — if you'd like a reply)</span>
              </label>
              <input
                id="fb-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-xl bg-gray-50 dark:bg-zinc-800 ring-1 ring-gray-200 dark:ring-zinc-700 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-amber-400 transition-shadow"
              />
            </div>

            {status === 'error' && (
              <p className="text-xs text-red-500">Something went wrong — please try again.</p>
            )}

            <button
              type="submit"
              disabled={status === 'submitting' || !message.trim()}
              className="mt-1 px-4 py-2 rounded-lg bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {status === 'submitting' ? 'Sending…' : 'Send feedback'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

export default FeedbackModal
