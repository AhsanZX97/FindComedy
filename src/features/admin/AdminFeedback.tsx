import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { getAllReports, resolveReport, deleteReportById } from '../../services/reportsService'
import { getReviewsForNight, deleteReviewById } from '../../services/reviewsService'
import { getAllNights } from '../../services/nightsService'
import { getAllFeedback, deleteFeedbackById } from '../../services/feedbackService'
import type { Report, Review, ComedyNight, SiteFeedback } from '../../types/comedyNight'
import { REPORT_TYPE_LABELS, VIBE_TAG_LABELS } from '../../types/comedyNight'
import { nightSlug } from '../../utils/slug'
import Header from '../../components/Header'
import RequireAdmin from './RequireAdmin'

type Tab = 'reports' | 'reviews' | 'feedback'

interface NightReports {
  night: ComedyNight
  reports: Report[]
}

function ReportRow({ report, nightPath, onResolve, onDelete, busy }: {
  report: Report
  nightPath: string
  onResolve: () => void
  onDelete: () => void
  busy: boolean
}) {
  return (
    <div className={`rounded-xl ring-1 px-4 py-3 flex flex-col gap-1 ${
      report.resolvedAt
        ? 'bg-gray-50 dark:bg-zinc-900/50 ring-gray-100 dark:ring-zinc-800/50 opacity-60'
        : 'bg-white dark:bg-zinc-900 ring-gray-200 dark:ring-zinc-800'
    }`}>
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-gray-700 dark:text-zinc-300">
          {REPORT_TYPE_LABELS[report.type]}
        </span>
        <div className="flex gap-1 shrink-0">
          <Link
            to={nightPath}
            className="text-xs px-2 py-1 rounded-md bg-gray-50 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-700 ring-1 ring-gray-200 dark:ring-zinc-700 transition-colors"
          >
            View
          </Link>
          {!report.resolvedAt && (
            <button
              onClick={onResolve}
              disabled={busy}
              className="text-xs px-2 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors disabled:opacity-50"
            >
              Resolve
            </button>
          )}
          <button
            onClick={onDelete}
            disabled={busy}
            className="text-xs px-2 py-1 rounded-md bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/60 transition-colors disabled:opacity-50"
          >
            Delete
          </button>
        </div>
      </div>
      {report.note && <p className="text-xs text-gray-500 dark:text-zinc-400">{report.note}</p>}
      <p className="text-xs text-gray-400 dark:text-zinc-600">
        {new Date(report.createdAt).toLocaleDateString('en-GB')}
        {report.resolvedAt && ` · Resolved ${new Date(report.resolvedAt).toLocaleDateString('en-GB')}`}
      </p>
    </div>
  )
}

function ReportsTab() {
  const [groups, setGroups] = useState<NightReports[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [showResolved, setShowResolved] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const [reports, nights] = await Promise.all([getAllReports(), getAllNights()])
    const byNight = new Map<string, Report[]>()
    for (const r of reports) {
      const list = byNight.get(r.nightId) ?? []
      list.push(r)
      byNight.set(r.nightId, list)
    }
    const result: NightReports[] = []
    for (const [nightId, nReports] of byNight) {
      const night = nights.find((n) => n.id === nightId)
      if (!night) continue
      result.push({ night, reports: nReports })
    }
    result.sort((a, b) => b.reports.filter((r) => !r.resolvedAt).length - a.reports.filter((r) => !r.resolvedAt).length)
    setGroups(result)
    setLoading(false)
  }, [])

  useEffect(() => { void load() }, [load])

  async function handleResolve(id: string) {
    setBusyId(id)
    await resolveReport(id)
    await load()
    setBusyId(null)
  }

  async function handleDelete(id: string) {
    setBusyId(id)
    await deleteReportById(id)
    await load()
    setBusyId(null)
  }

  if (loading) return <div className="flex justify-center py-12"><div className="w-8 h-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" /></div>

  if (groups.length === 0) return <p className="text-sm text-gray-400 dark:text-zinc-500">No reports yet.</p>

  return (
    <div className="flex flex-col gap-6">
      <label className="flex items-center gap-2 text-sm text-gray-500 dark:text-zinc-400">
        <input type="checkbox" checked={showResolved} onChange={(e) => setShowResolved(e.target.checked)} className="accent-amber-500" />
        Show resolved
      </label>
      {groups.map(({ night, reports }) => {
        const visible = showResolved ? reports : reports.filter((r) => !r.resolvedAt)
        if (visible.length === 0) return null
        return (
          <div key={night.id} className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Link to={`/admin/nights/${night.id}`} className="font-semibold text-gray-900 dark:text-white hover:text-amber-500 transition-colors">
                {night.name}
              </Link>
              <span className="text-xs text-gray-400 dark:text-zinc-500">{night.venue.area}</span>
              <span className="ml-auto text-xs text-gray-400 dark:text-zinc-500">{visible.length} report{visible.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="flex flex-col gap-2 pl-3 border-l-2 border-gray-200 dark:border-zinc-700">
              {visible.map((r) => (
                <ReportRow
                  key={r.id}
                  report={r}
                  nightPath={`/night/${nightSlug(night)}`}
                  onResolve={() => void handleResolve(r.id)}
                  onDelete={() => void handleDelete(r.id)}
                  busy={busyId === r.id}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function ReviewCard({ review, onDelete, busy }: { review: Review; onDelete: () => void; busy: boolean }) {
  return (
    <div className="rounded-xl bg-white dark:bg-zinc-900 ring-1 ring-gray-200 dark:ring-zinc-800 px-4 py-3 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-500 dark:text-zinc-400">{review.displayName ?? 'Anonymous'}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 dark:text-zinc-600">{new Date(review.createdAt).toLocaleDateString('en-GB')}</span>
          <button
            onClick={onDelete}
            disabled={busy}
            className="text-xs px-2 py-1 rounded-md bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/60 transition-colors disabled:opacity-50"
          >
            Delete
          </button>
        </div>
      </div>
      <div className="flex flex-wrap gap-1">
        {review.tags.map((tag) => (
          <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 ring-1 ring-gray-200 dark:ring-zinc-700">
            {VIBE_TAG_LABELS[tag]}
          </span>
        ))}
      </div>
      {review.note && <p className="text-sm text-gray-700 dark:text-zinc-300">{review.note}</p>}
    </div>
  )
}

function ReviewsTab() {
  const [nights, setNights] = useState<ComedyNight[]>([])
  const [reviewsByNight, setReviewsByNight] = useState<Record<string, Review[]>>({})
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)

  useEffect(() => {
    getAllNights().then(async (ns) => {
      setNights(ns)
      const entries = await Promise.all(
        ns.map(async (n) => {
          const reviews = await getReviewsForNight(n.id)
          return [n.id, reviews] as [string, Review[]]
        })
      )
      setReviewsByNight(Object.fromEntries(entries.filter(([, r]) => r.length > 0)))
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  async function handleDelete(reviewId: string, nightId: string) {
    setBusyId(reviewId)
    await deleteReviewById(reviewId)
    setReviewsByNight((prev) => ({
      ...prev,
      [nightId]: (prev[nightId] ?? []).filter((r) => r.id !== reviewId),
    }))
    setBusyId(null)
  }

  if (loading) return <div className="flex justify-center py-12"><div className="w-8 h-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" /></div>

  const nightsWithReviews = nights.filter((n) => (reviewsByNight[n.id]?.length ?? 0) > 0)
  if (nightsWithReviews.length === 0) return <p className="text-sm text-gray-400 dark:text-zinc-500">No reviews yet.</p>

  return (
    <div className="flex flex-col gap-6">
      {nightsWithReviews.map((night) => (
        <div key={night.id} className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Link to={`/admin/nights/${night.id}`} className="font-semibold text-gray-900 dark:text-white hover:text-amber-500 transition-colors">
              {night.name}
            </Link>
            <span className="text-xs text-gray-400 dark:text-zinc-500">{night.venue.area}</span>
          </div>
          <div className="flex flex-col gap-2 pl-3 border-l-2 border-gray-200 dark:border-zinc-700">
            {(reviewsByNight[night.id] ?? []).map((r) => (
              <ReviewCard
                key={r.id}
                review={r}
                onDelete={() => void handleDelete(r.id, night.id)}
                busy={busyId === r.id}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function FeedbackCard({ item, onDelete, busy }: { item: SiteFeedback; onDelete: () => void; busy: boolean }) {
  return (
    <div className="rounded-xl bg-white dark:bg-zinc-900 ring-1 ring-gray-200 dark:ring-zinc-800 px-4 py-3 flex flex-col gap-2">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-gray-700 dark:text-zinc-300 whitespace-pre-wrap">{item.message}</p>
        <button
          onClick={onDelete}
          disabled={busy}
          className="shrink-0 text-xs px-2 py-1 rounded-md bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/60 transition-colors disabled:opacity-50"
        >
          Delete
        </button>
      </div>
      <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-zinc-500">
        <span>{new Date(item.createdAt).toLocaleDateString('en-GB')}</span>
        {item.email && <span>{item.email}</span>}
      </div>
    </div>
  )
}

function FeedbackTab() {
  const [items, setItems] = useState<SiteFeedback[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)

  useEffect(() => {
    getAllFeedback()
      .then(setItems)
      .catch(() => { /* leave empty */ })
      .finally(() => setLoading(false))
  }, [])

  async function handleDelete(id: string) {
    setBusyId(id)
    await deleteFeedbackById(id)
    setItems((prev) => prev.filter((f) => f.id !== id))
    setBusyId(null)
  }

  if (loading) return <div className="flex justify-center py-12"><div className="w-8 h-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" /></div>
  if (items.length === 0) return <p className="text-sm text-gray-400 dark:text-zinc-500">No feedback yet.</p>

  return (
    <div className="flex flex-col gap-3">
      {items.map((item) => (
        <FeedbackCard
          key={item.id}
          item={item}
          onDelete={() => void handleDelete(item.id)}
          busy={busyId === item.id}
        />
      ))}
    </div>
  )
}

function AdminFeedbackInner() {
  const [tab, setTab] = useState<Tab>('reports')

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-white">
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-8 flex flex-col gap-6">
        <div>
          <Link to="/admin" className="text-xs text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300 transition-colors">
            ← Admin
          </Link>
          <h1 className="text-2xl font-display font-bold mt-1">Reports &amp; reviews</h1>
        </div>

        <div className="flex gap-1">
          {(['reports', 'reviews', 'feedback'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${
                tab === t
                  ? 'bg-gray-900 text-white dark:bg-zinc-200 dark:text-zinc-900'
                  : 'text-gray-500 hover:text-gray-800 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === 'reports' && <ReportsTab />}
        {tab === 'reviews' && <ReviewsTab />}
        {tab === 'feedback' && <FeedbackTab />}
      </main>
    </div>
  )
}

export default function AdminFeedback() {
  return (
    <RequireAdmin>
      <AdminFeedbackInner />
    </RequireAdmin>
  )
}
