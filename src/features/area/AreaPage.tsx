import { useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useNights } from '../../hooks/useNights'
import { useSeo } from '../../hooks/useSeo'
import { slugify, nightSlug } from '../../utils/slug'
import { normalizeToBorough, LONDON_BOROUGHS } from '../../utils/londonBoroughs'
import NightCard from '../../components/NightCard'
import Header from '../../components/Header'

function humanizeSlug(slug: string): string {
  return slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

// Resolve the canonical borough name from a URL slug (e.g. "tower-hamlets" → "Tower Hamlets")
function boroughFromSlug(slug: string): string | null {
  return (LONDON_BOROUGHS as readonly string[]).find((b) => slugify(b) === slug) ?? null
}

function CardSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-white dark:bg-zinc-900 p-5 ring-1 ring-gray-200 dark:ring-zinc-800 animate-pulse">
      <div className="flex gap-1.5">
        <div className="h-5 w-20 rounded-full bg-gray-200 dark:bg-zinc-800" />
      </div>
      <div className="h-6 w-3/4 rounded bg-gray-200 dark:bg-zinc-800" />
      <div className="h-4 w-1/2 rounded bg-gray-200 dark:bg-zinc-800" />
      <div className="h-4 w-2/5 rounded bg-gray-200 dark:bg-zinc-800" />
    </div>
  )
}

export default function AreaPage() {
  const { areaSlug = '' } = useParams<{ areaSlug: string }>()

  const nightsState = useNights()

  const { borough, nights } = useMemo(() => {
    const resolved = boroughFromSlug(areaSlug) ?? humanizeSlug(areaSlug)
    if (nightsState.status !== 'ready') return { borough: resolved, nights: [] }
    const matching = nightsState.data.filter(
      (n) => n.status === 'active' && normalizeToBorough(n.venue.area) === resolved,
    )
    return { borough: resolved, nights: matching }
  }, [nightsState, areaSlug])

  const displayArea = borough

  useSeo({
    title: `Open Mic Comedy Nights in ${displayArea}, London | FindComedy`,
    description: `Find open mic comedy, showcases and pro nights in ${displayArea}, London. Every listing kept fresh by comedians and audiences who actually go.`,
    path: `/comedy/${areaSlug}`,
  })

  return (
    <div className="min-h-dvh flex flex-col bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-white">
      <Header />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8 flex flex-col gap-8">
        {/* Intro */}
        <div className="flex flex-col gap-3">
          <h1 className="text-3xl font-display font-bold tracking-tight text-gray-900 dark:text-white">
            Open Mic Comedy Nights in {displayArea}, London
          </h1>
          <p className="text-gray-600 dark:text-zinc-400 leading-relaxed">
            Looking for comedy nights in {displayArea}? FindComedy lists every open mic, showcase
            and pro comedy night in {displayArea} — kept up to date by comedians and audiences who
            actually go.
          </p>
          <Link
            to="/"
            className="text-sm text-amber-700 dark:text-amber-400 hover:underline"
          >
            ← Browse all London comedy nights
          </Link>
        </div>

        {/* Night listing */}
        {nightsState.status === 'loading' && (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        )}

        {nightsState.status === 'error' && (
          <div className="rounded-2xl bg-white dark:bg-zinc-900 p-8 text-center ring-1 ring-gray-200 dark:ring-zinc-800">
            <p className="text-gray-500 dark:text-zinc-400">{nightsState.message}</p>
          </div>
        )}

        {nightsState.status === 'ready' && nights.length === 0 && (
          <div className="rounded-2xl bg-white dark:bg-zinc-900 p-10 text-center ring-1 ring-gray-200 dark:ring-zinc-800 flex flex-col gap-2">
            <p className="text-gray-700 dark:text-zinc-300 font-medium">
              No active nights listed for {displayArea} yet.
            </p>
            <p className="text-gray-400 dark:text-zinc-500 text-sm">
              <Link to="/submit" className="underline">Submit one</Link> or{' '}
              <Link to="/" className="underline">browse all nights</Link>.
            </p>
          </div>
        )}

        {nightsState.status === 'ready' && nights.length > 0 && (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-gray-500 dark:text-zinc-400">
              {nights.length} {nights.length === 1 ? 'night' : 'nights'} in {displayArea}
            </p>
            {nights.map((night) => (
              <NightCard
                key={night.id}
                night={night}
                footerAction={
                  <Link
                    to={`/night/${nightSlug(night)}`}
                    className="text-xs font-medium text-amber-700 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300 hover:underline transition-colors"
                  >
                    View full night →
                  </Link>
                }
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
