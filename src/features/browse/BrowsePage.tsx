import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useNights } from '../../hooks/useNights'
import { filterNights, sortByTime, getUniqueAreas } from '../../utils/filterNights'
import NightCard from '../../components/NightCard'
import FilterBar from './FilterBar'
import type { NightFilters, Weekday } from '../../types/comedyNight'
import { DEFAULT_FILTERS } from '../../types/comedyNight'
import { useAuth } from '../auth/AuthContext'

function todayWeekday(): Weekday {
  return new Date().getDay() as Weekday
}

function CardSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-zinc-900 p-5 ring-1 ring-zinc-800 animate-pulse">
      <div className="flex gap-1.5">
        <div className="h-5 w-20 rounded-full bg-zinc-800" />
        <div className="h-5 w-16 rounded-full bg-zinc-800" />
      </div>
      <div className="h-6 w-3/4 rounded bg-zinc-800" />
      <div className="flex flex-col gap-1">
        <div className="h-4 w-1/2 rounded bg-zinc-800" />
        <div className="h-3 w-1/3 rounded bg-zinc-800" />
      </div>
      <div className="h-4 w-2/5 rounded bg-zinc-800" />
      <div className="h-px w-full bg-zinc-800 mt-auto" />
      <div className="flex justify-between">
        <div className="h-3 w-16 rounded bg-zinc-800" />
        <div className="h-3 w-12 rounded bg-zinc-800" />
      </div>
    </div>
  )
}

interface BrowsePageProps {
  preset?: 'tonight'
}

export default function BrowsePage({ preset }: BrowsePageProps) {
  const { user } = useAuth()
  const [filters, setFilters] = useState<NightFilters>(() =>
    preset === 'tonight' ? { ...DEFAULT_FILTERS, weekday: todayWeekday() } : DEFAULT_FILTERS,
  )

  const nightsState = useNights()

  const areas = useMemo(
    () => (nightsState.status === 'ready' ? getUniqueAreas(nightsState.data) : []),
    [nightsState],
  )

  const filtered = useMemo(() => {
    if (nightsState.status !== 'ready') return []
    const results = filterNights(nightsState.data, filters)
    return preset === 'tonight' ? sortByTime(results) : results
  }, [nightsState, filters, preset])

  const isTonight = preset === 'tonight'

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-zinc-950/90 backdrop-blur border-b border-zinc-800">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-4">
          <Link to="/" className="text-xl font-display font-bold text-amber-400 shrink-0">
            FindComedy
          </Link>
          <nav className="flex gap-3 ml-auto text-sm items-center">
            <Link
              to="/"
              className={`px-3 py-1 rounded-lg transition-colors ${
                !isTonight ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Browse
            </Link>
            <Link
              to="/tonight"
              className={`px-3 py-1 rounded-lg transition-colors ${
                isTonight ? 'text-amber-400' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Tonight
            </Link>
            <Link
              to="/map"
              className="px-3 py-1 rounded-lg text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Map
            </Link>
            <span className="text-zinc-700 select-none">·</span>
            {user ? (
              <Link to="/my" className="px-3 py-1 rounded-lg text-amber-400 hover:text-amber-300 transition-colors">
                My nights
              </Link>
            ) : (
              <Link to="/auth" className="px-3 py-1 rounded-lg text-zinc-500 hover:text-zinc-300 transition-colors">
                Sign in
              </Link>
            )}
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 flex flex-col gap-6">
        {/* Page title */}
        <div>
          <h1 className="text-2xl font-display font-bold">
            {isTonight ? "What's on tonight" : 'London comedy nights'}
          </h1>
          {isTonight && (
            <p className="text-sm text-zinc-400 mt-1">
              {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          )}
        </div>

        {/* Filter bar */}
        <FilterBar filters={filters} areas={areas} onChange={setFilters} />

        {/* Results */}
        {nightsState.status === 'loading' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        )}

        {nightsState.status === 'error' && (
          <div className="rounded-2xl bg-zinc-900 p-8 text-center ring-1 ring-zinc-800">
            <p className="text-zinc-400">{nightsState.message}</p>
          </div>
        )}

        {nightsState.status === 'ready' && (
          <>
            <p className="text-sm text-zinc-500">
              {filtered.length} {filtered.length === 1 ? 'night' : 'nights'}
            </p>

            {filtered.length === 0 ? (
              <div className="rounded-2xl bg-zinc-900 p-10 text-center ring-1 ring-zinc-800 flex flex-col gap-2">
                <p className="text-zinc-300 font-medium">No nights match your filters.</p>
                <p className="text-zinc-500 text-sm">Try adjusting or clearing the filters above.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map((night) => (
                  <NightCard key={night.id} night={night} />
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
