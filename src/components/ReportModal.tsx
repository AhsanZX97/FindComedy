import { useState } from 'react'
import { submitReport } from '../services/reportsService'
import type { ReportType } from '../types/comedyNight'
import { REPORT_TYPE_LABELS } from '../types/comedyNight'

const REPORT_TYPES: ReportType[] = [
  'no-longer-running',
  'wrong-time',
  'wrong-venue',
  'wrong-info',
  'other',
]

type ModalState = 'closed' | 'open' | 'submitting' | 'done' | 'error'

interface ReportModalProps {
  nightId: string
  userId: string
  onAuthRequired: () => void
  isLoggedIn: boolean
}

export default function ReportModal({
  nightId,
  userId,
  onAuthRequired,
  isLoggedIn,
}: ReportModalProps) {
  const [state, setState] = useState<ModalState>('closed')
  const [selected, setSelected] = useState<ReportType>('no-longer-running')
  const [note, setNote] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  function open() {
    if (!isLoggedIn) {
      onAuthRequired()
      return
    }
    setState('open')
  }

  function close() {
    setState('closed')
    setNote('')
    setSelected('no-longer-running')
    setErrorMsg('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setState('submitting')
    try {
      await submitReport(userId, nightId, selected, note || undefined)
      setState('done')
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong')
      setState('error')
    }
  }

  return (
    <>
      <button
        onClick={open}
        className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 ring-1 ring-gray-200 dark:ring-zinc-700 hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors font-medium"
      >
        Request update
      </button>

      {state !== 'closed' && (
        <div
          className="fixed inset-0 z-[2000] flex items-end sm:items-center justify-center p-4 bg-black/40 dark:bg-black/70"
          onClick={(e) => { if (e.target === e.currentTarget) close() }}
        >
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900 ring-1 ring-gray-200 dark:ring-zinc-800 shadow-xl p-6 flex flex-col gap-5">
            {state === 'done' ? (
              <>
                <p className="text-sm text-gray-800 dark:text-zinc-200 font-medium">Thanks for your request!</p>
                <p className="text-sm text-gray-500 dark:text-zinc-400">We'll review it and update the listing if needed.</p>
                <button
                  onClick={close}
                  className="self-end px-4 py-2 rounded-lg bg-gray-100 dark:bg-zinc-800 text-sm text-gray-700 dark:text-zinc-300 hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors"
                >
                  Close
                </button>
              </>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Request update</h3>
                  <button
                    type="button"
                    onClick={close}
                    className="text-gray-400 dark:text-zinc-500 hover:text-gray-700 dark:hover:text-zinc-200 text-lg leading-none"
                    aria-label="Close"
                  >
                    ×
                  </button>
                </div>

                <fieldset className="flex flex-col gap-2">
                  {REPORT_TYPES.map((type) => (
                    <label key={type} className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="radio"
                        name="report-type"
                        value={type}
                        checked={selected === type}
                        onChange={() => setSelected(type)}
                        className="accent-amber-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-zinc-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                        {REPORT_TYPE_LABELS[type]}
                      </span>
                    </label>
                  ))}
                </fieldset>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-gray-400 dark:text-zinc-500 uppercase tracking-wide">
                    Extra details (optional)
                  </label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={2}
                    maxLength={300}
                    placeholder="e.g. moved to a new venue in March"
                    className="w-full rounded-lg bg-gray-50 dark:bg-zinc-800 ring-1 ring-gray-200 dark:ring-zinc-700 px-3 py-2 text-sm text-gray-700 dark:text-zinc-200 placeholder-gray-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-amber-400 resize-none"
                  />
                </div>

                {state === 'error' && (
                  <p className="text-xs text-red-500">{errorMsg}</p>
                )}

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={close}
                    className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-zinc-800 text-sm text-gray-700 dark:text-zinc-300 hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={state === 'submitting'}
                    className="px-4 py-2 rounded-lg bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 transition-colors disabled:opacity-50"
                  >
                    {state === 'submitting' ? 'Sending…' : 'Send request'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
