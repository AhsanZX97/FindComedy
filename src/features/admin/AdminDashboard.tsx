import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getSubmissions } from '../../services/submissionsService'
import { getAllReports } from '../../services/reportsService'
import { getAllNights } from '../../services/nightsService'
import { getAllFeedback } from '../../services/feedbackService'
import Header from '../../components/Header'
import RequireAdmin from './RequireAdmin'

interface Stats {
  pendingSubmissions: number
  openReports: number
  totalNights: number
  unreadFeedback: number
}

function StatCard({ label, value, to }: { label: string; value: number; to: string }) {
  return (
    <Link
      to={to}
      className="rounded-2xl bg-white dark:bg-zinc-900 ring-1 ring-gray-200 dark:ring-zinc-800 p-5 flex flex-col gap-1 hover:ring-amber-400 transition-colors"
    >
      <span className="text-3xl font-display font-bold text-gray-900 dark:text-white">{value}</span>
      <span className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-zinc-500">{label}</span>
    </Link>
  )
}

function AdminDashboardInner() {
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    Promise.all([
      getSubmissions('pending'),
      getAllReports(),
      getAllNights(),
      getAllFeedback(),
    ]).then(([subs, reports, nights, feedback]) => {
      setStats({
        pendingSubmissions: subs.length,
        openReports: reports.filter((r) => !r.resolvedAt).length,
        totalNights: nights.length,
        unreadFeedback: feedback.length,
      })
    }).catch(() => { /* stats stay null, display dashes */ })
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-white">
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-8 flex flex-col gap-8">
        <div>
          <h1 className="text-2xl font-display font-bold">Admin</h1>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">Manage nights, submissions, and moderation.</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard label="Pending submissions" value={stats?.pendingSubmissions ?? 0} to="/admin/queue" />
          <StatCard label="Open reports" value={stats?.openReports ?? 0} to="/admin/feedback" />
          <StatCard label="Total nights" value={stats?.totalNights ?? 0} to="/" />
          <StatCard label="Feedback" value={stats?.unreadFeedback ?? 0} to="/admin/feedback" />
        </div>

        <nav className="flex flex-col gap-3">
          <Link
            to="/admin/queue"
            className="rounded-xl bg-white dark:bg-zinc-900 ring-1 ring-gray-200 dark:ring-zinc-800 px-5 py-4 flex items-center justify-between hover:ring-amber-400 transition-colors"
          >
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">Submission queue</p>
              <p className="text-sm text-gray-500 dark:text-zinc-400 mt-0.5">Review, approve, or reject submitted nights</p>
            </div>
            <span className="text-gray-400 dark:text-zinc-500">→</span>
          </Link>

          <Link
            to="/admin/feedback"
            className="rounded-xl bg-white dark:bg-zinc-900 ring-1 ring-gray-200 dark:ring-zinc-800 px-5 py-4 flex items-center justify-between hover:ring-amber-400 transition-colors"
          >
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">Reports, reviews &amp; feedback</p>
              <p className="text-sm text-gray-500 dark:text-zinc-400 mt-0.5">Resolve reports, moderate reviews, read site feedback</p>
            </div>
            <span className="text-gray-400 dark:text-zinc-500">→</span>
          </Link>
        </nav>
      </main>
    </div>
  )
}

export default function AdminDashboard() {
  return (
    <RequireAdmin>
      <AdminDashboardInner />
    </RequireAdmin>
  )
}
