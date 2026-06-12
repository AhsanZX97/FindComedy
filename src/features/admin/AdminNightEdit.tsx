import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { getNightById, deleteNight } from '../../services/nightsService'
import type { ComedyNight } from '../../types/comedyNight'
import Header from '../../components/Header'
import AdminNightForm from './AdminNightForm'
import RequireAdmin from './RequireAdmin'

function AdminNightEditInner() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [night, setNight] = useState<ComedyNight | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error' | 'not-found'>('loading')
  const [deleteConfirm, setDeleteConfirm] = useState(false)

  useEffect(() => {
    if (!id) { setStatus('not-found'); return }
    getNightById(id)
      .then((n) => {
        if (!n) { setStatus('not-found'); return }
        setNight(n)
        setStatus('ready')
      })
      .catch(() => setStatus('error'))
  }, [id])

  async function handleDelete() {
    if (!id) return
    await deleteNight(id)
    navigate('/admin')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-white">
      <Header />
      <main className="max-w-2xl mx-auto px-4 py-8 flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <div>
            <Link to="/admin" className="text-xs text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300 transition-colors">
              ← Admin
            </Link>
            <h1 className="text-2xl font-display font-bold mt-1">Edit night</h1>
          </div>
          {night && (
            <div>
              {!deleteConfirm ? (
                <button
                  onClick={() => setDeleteConfirm(true)}
                  className="px-3 py-1.5 rounded-lg text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                >
                  Delete night
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-red-500">Are you sure?</span>
                  <button onClick={() => void handleDelete()} className="px-3 py-1.5 rounded-lg text-sm bg-red-500 text-white hover:bg-red-600 transition-colors">
                    Yes, delete
                  </button>
                  <button onClick={() => setDeleteConfirm(false)} className="px-3 py-1.5 rounded-lg text-sm bg-gray-200 dark:bg-zinc-700 text-gray-700 dark:text-zinc-300 hover:bg-gray-300 dark:hover:bg-zinc-600 transition-colors">
                    Cancel
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {status === 'loading' && (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
          </div>
        )}

        {status === 'not-found' && (
          <p className="text-gray-400 dark:text-zinc-500">Night not found.</p>
        )}

        {status === 'error' && (
          <p className="text-red-500">Failed to load night.</p>
        )}

        {status === 'ready' && night && (
          <AdminNightForm
            initial={night}
            onSaved={(saved) => {
              setNight(saved)
            }}
          />
        )}
      </main>
    </div>
  )
}

export default function AdminNightEdit() {
  return (
    <RequireAdmin>
      <AdminNightEditInner />
    </RequireAdmin>
  )
}
