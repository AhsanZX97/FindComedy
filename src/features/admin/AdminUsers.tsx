import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { getAllProfiles, updateProfile } from '../../services/profilesService'
import type { Profile, UserRole } from '../../types/auth'
import Header from '../../components/Header'
import RequireAdmin from './RequireAdmin'

const ROLE_LABELS: Record<UserRole, string> = {
  punter: 'Punter',
  comic: 'Comic',
  promoter: 'Promoter',
}

const ROLES: UserRole[] = ['punter', 'comic', 'promoter']

function UserRow({ profile, onRoleChange }: { profile: Profile; onRoleChange: (id: string, role: UserRole) => Promise<void> }) {
  const [saving, setSaving] = useState(false)

  async function handleRoleChange(role: UserRole) {
    setSaving(true)
    try {
      await onRoleChange(profile.id, role)
    } finally {
      setSaving(false)
    }
  }

  const joined = new Date(profile.createdAt).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  })

  return (
    <div className="rounded-xl bg-white dark:bg-zinc-900 ring-1 ring-gray-200 dark:ring-zinc-800 px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 dark:text-white truncate">{profile.displayName || '(no name)'}</p>
        <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">Joined {joined}</p>
      </div>
      <div className="flex items-center gap-1">
        {ROLES.map((role) => (
          <button
            key={role}
            disabled={saving}
            onClick={() => void handleRoleChange(role)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${
              profile.role === role
                ? 'bg-amber-500 text-white'
                : 'text-gray-500 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-800'
            }`}
          >
            {ROLE_LABELS[role]}
          </button>
        ))}
      </div>
    </div>
  )
}

function AdminUsersInner() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setErrorMsg('')
    try {
      const data = await getAllProfiles()
      setProfiles(data)
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  async function handleRoleChange(userId: string, role: UserRole) {
    await updateProfile(userId, { role })
    setProfiles((prev) => prev.map((p) => p.id === userId ? { ...p, role } : p))
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-white">
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-8 flex flex-col gap-6">
        <div>
          <Link to="/admin" className="text-xs text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300 transition-colors">
            ← Admin
          </Link>
          <h1 className="text-2xl font-display font-bold mt-1">Users</h1>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">{profiles.length} registered user{profiles.length !== 1 ? 's' : ''}</p>
        </div>

        {errorMsg && <p className="text-sm text-red-500">{errorMsg}</p>}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
          </div>
        ) : profiles.length === 0 ? (
          <p className="text-gray-400 dark:text-zinc-500 text-sm">No users yet.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {profiles.map((profile) => (
              <UserRow key={profile.id} profile={profile} onRoleChange={handleRoleChange} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

export default function AdminUsers() {
  return (
    <RequireAdmin>
      <AdminUsersInner />
    </RequireAdmin>
  )
}
