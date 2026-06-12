import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { getSubmissions } from '../../services/submissionsService'
import type { StoredSubmission } from '../../types/comedyNight'
import Header from '../../components/Header'
import SubmissionCard from './SubmissionCard'
import RequireAdmin from './RequireAdmin'

type Filter = 'pending' | 'approved' | 'rejected' | 'all'

function AdminSubmissionsInner() {
  const [submissions, setSubmissions] = useState<StoredSubmission[]>([])
  const [filter, setFilter] = useState<Filter>('pending')
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setErrorMsg('')
    try {
      const data = await getSubmissions(filter === 'all' ? undefined : filter)
      setSubmissions(data)
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to load submissions')
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => { void load() }, [load])

  const filters: Filter[] = ['pending', 'approved', 'rejected', 'all']

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-white">
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-8 flex flex-col gap-6">
        <div>
          <Link to="/admin" className="text-xs text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300 transition-colors">
            ← Admin
          </Link>
          <h1 className="text-2xl font-display font-bold mt-1">Submission queue</h1>
        </div>

        <div className="flex gap-1">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${
                filter === f
                  ? 'bg-gray-900 text-white dark:bg-zinc-200 dark:text-zinc-900'
                  : 'text-gray-500 hover:text-gray-800 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {errorMsg && <p className="text-sm text-red-500">{errorMsg}</p>}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
          </div>
        ) : submissions.length === 0 ? (
          <p className="text-gray-400 dark:text-zinc-500 text-sm">No {filter === 'all' ? '' : filter} submissions.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {submissions.map((sub) =>
              sub.status === 'pending' ? (
                <Link key={sub.id} to={`/admin/queue/${sub.id}`} className="block group">
                  <SubmissionCard
                    sub={sub}
                    className="group-hover:ring-amber-300 dark:group-hover:ring-amber-700 cursor-pointer"
                  />
                </Link>
              ) : (
                <SubmissionCard key={sub.id} sub={sub} />
              )
            )}
          </div>
        )}
      </main>
    </div>
  )
}

export default function AdminSubmissions() {
  return (
    <RequireAdmin>
      <AdminSubmissionsInner />
    </RequireAdmin>
  )
}
