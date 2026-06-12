import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useNights } from '../../hooks/useNights'
import { filterNights, sortByTime, getUniqueAreas } from '../../utils/filterNights'
import NightCard from '../../components/NightCard'
import FilterBar from './FilterBar'
import Header from '../../components/Header'
import NightsMap, { TYPE_COLORS, TYPE_LABELS } from './NightsMap'
import type { ComedyNight, NightFilters, Weekday } from '../../types/comedyNight'
import { DEFAULT_FILTERS } from '../../types/comedyNight'

function todayWeekday(): Weekday {
  return new Date().getDay() as Weekday
}

const WEEKDAY_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function formatTodayDate(): string {
  return new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
}

function CardSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-white dark:bg-zinc-900 p-5 ring-1 ring-gray-200 dark:ring-zinc-800 animate-pulse">
      <div className="flex gap-1.5">
        <div className="h-5 w-20 rounded-full bg-gray-200 dark:bg-zinc-800" />
        <div className="h-5 w-16 rounded-full bg-gray-200 dark:bg-zinc-800" />
      </div>
      <div className="h-6 w-3/4 rounded bg-gray-200 dark:bg-zinc-800" />
      <div className="flex flex-col gap-1">
        <div className="h-4 w-1/2 rounded bg-gray-200 dark:bg-zinc-800" />
        <div className="h-3 w-1/3 rounded bg-gray-100 dark:bg-zinc-700" />
      </div>
      <div className="h-4 w-2/5 rounded bg-gray-200 dark:bg-zinc-800" />
      <div className="h-px w-full bg-gray-100 dark:bg-zinc-800 mt-auto" />
      <div className="flex justify-between">
        <div className="h-3 w-16 rounded bg-gray-100 dark:bg-zinc-700" />
        <div className="h-3 w-12 rounded bg-gray-100 dark:bg-zinc-700" />
      </div>
    </div>
  )
}

interface BottomCardProps {
  nightId: string | null
  nights: ComedyNight[]
  onClose: () => void
}

function BottomCard({ nightId, nights, onClose }: BottomCardProps) {
  const night = nights.find((n) => n.id === nightId)
  if (!night) return null
  const isFree = night.pricing.entry.toLowerCase() === 'free'
  return (
    <div className="fixed bottom-0 left-0 right-0 z-[1001] bg-white dark:bg-zinc-900 border-t border-gray-200 dark:border-zinc-800 rounded-t-2xl shadow-xl p-5 flex flex-col gap-3 animate-[slideUp_150ms_ease-out]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1 min-w-0">
          <span
            className="text-xs font-medium px-2 py-0.5 rounded-full w-fit"
            style={{ background: `${TYPE_COLORS[night.type]}18`, color: TYPE_COLORS[night.type], border: `1px solid ${TYPE_COLORS[night.type]}44` }}
          >
            {TYPE_LABELS[night.type]}
          </span>
          <h2 className="text-lg font-display font-bold text-amber-500 leading-tight">{night.name}</h2>
          <p className="text-sm text-gray-500 dark:text-zinc-400">{night.venue.name} · {night.venue.area}</p>
        </div>
        <button onClick={onClose} aria-label="Close" className="text-gray-400 dark:text-zinc-500 hover:text-gray-700 dark:hover:text-zinc-200 text-xl shrink-0 leading-none mt-1">×</button>
      </div>
      <div className="flex items-center justify-between">
        <span className={`text-sm font-semibold ${isFree ? 'text-emerald-600' : 'text-gray-700 dark:text-zinc-300'}`}>
          {isFree ? 'Free entry' : night.pricing.entry}
        </span>
        <Link
          to={`/night/${night.id}`}
          className="px-4 py-1.5 rounded-lg bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 transition-colors"
        >
          View night →
        </Link>
      </div>
    </div>
  )
}

export default function BrowsePage() {
  const [filters, setFilters] = useState<NightFilters>(() => ({
    ...DEFAULT_FILTERS,
    weekday: todayWeekday(),
  }))
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [mobileView, setMobileView] = useState<'list' | 'map'>('list')

  const nightsState = useNights()
  const listRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({})

  const areas = useMemo(
    () => (nightsState.status === 'ready' ? getUniqueAreas(nightsState.data) : []),
    [nightsState],
  )

  const filtered = useMemo(() => {
    if (nightsState.status !== 'ready') return []
    const results = filterNights(nightsState.data, filters)
    return filters.weekday !== null ? sortByTime(results) : results
  }, [nightsState, filters])

  const selectedNight = filtered.find((n) => n.id === selectedId) ?? null
  const effectiveSelectedId = selectedNight ? selectedId : null

  const isTonight = filters.weekday === todayWeekday()

  function handleMarkerSelect(id: string) {
    setSelectedId(id)
    const el = cardRefs.current[id]
    if (el) {
      el.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }
  }

  const pageTitle = filters.weekday !== null
    ? (isTonight ? "What's on tonight" : `${WEEKDAY_LONG[filters.weekday]} nights`)
    : 'London comedy nights'

  const countLine = nightsState.status === 'ready'
    ? `${filtered.length} ${filtered.length === 1 ? 'night' : 'nights'}${isTonight ? ` · ${formatTodayDate()}` : ''}`
    : null

  return (
    <div className="h-dvh flex flex-col bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-white overflow-hidden">
      <Header />

      {/* Split view — desktop: map left (3fr) + list right (2fr); mobile: single panel */}
      <div className="flex-1 min-h-0 md:grid md:grid-cols-[3fr_2fr]">

        {/* MAP PANEL */}
        <div className={`relative h-full ${mobileView === 'map' ? 'block' : 'hidden md:block'}`}>
          {nightsState.status === 'loading' && (
            <div className="h-full bg-gray-200 dark:bg-zinc-900 animate-pulse" />
          )}
          {nightsState.status === 'ready' && (
            <NightsMap
              nights={filtered}
              selectedId={effectiveSelectedId}
              onSelect={handleMarkerSelect}
              onDeselect={() => setSelectedId(null)}
              invalidateTrigger={mobileView}
            />
          )}

          {/* Mobile: back to list button */}
          <div className="absolute top-3 right-3 z-[1000] flex gap-2 md:hidden">
            <button
              onClick={() => setMobileView('list')}
              className="px-3 py-1.5 rounded-full bg-white/95 dark:bg-zinc-900/95 text-sm font-medium text-gray-700 dark:text-zinc-300 ring-1 ring-gray-300 dark:ring-zinc-700 shadow"
            >
              ← List
            </button>
          </div>

          {/* Mobile bottom card on map */}
          <div className="md:hidden">
            <BottomCard
              nightId={effectiveSelectedId}
              nights={filtered}
              onClose={() => setSelectedId(null)}
            />
          </div>
        </div>

        {/* LIST PANEL */}
        <div
          ref={listRef}
          className={`flex flex-col h-full overflow-y-auto bg-white dark:bg-zinc-950 border-l border-gray-200 dark:border-zinc-800 ${mobileView === 'list' ? 'block' : 'hidden md:flex'}`}
        >
          {/* Filters + title */}
          <div className="sticky top-0 z-10 bg-white/95 dark:bg-zinc-950/95 backdrop-blur border-b border-gray-200 dark:border-zinc-800 px-4 pt-4 pb-3 flex flex-col gap-3">
            <div>
              <h1 className="text-lg font-display font-bold leading-tight text-gray-900 dark:text-white">{pageTitle}</h1>
              {countLine && <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">{countLine}</p>}
            </div>
            <FilterBar filters={filters} areas={areas} onChange={(f) => { setFilters(f); setSelectedId(null) }} />
          </div>

          {/* Cards */}
          <div className="flex-1 px-4 py-4">
            {nightsState.status === 'loading' && (
              <div className="flex flex-col gap-3">
                {Array.from({ length: 5 }).map((_, i) => <CardSkeleton key={i} />)}
              </div>
            )}

            {nightsState.status === 'error' && (
              <div className="rounded-2xl bg-white dark:bg-zinc-900 p-8 text-center ring-1 ring-gray-200 dark:ring-zinc-800">
                <p className="text-gray-500 dark:text-zinc-400">{nightsState.message}</p>
              </div>
            )}

            {nightsState.status === 'ready' && filtered.length === 0 && (
              <div className="rounded-2xl bg-white dark:bg-zinc-900 p-10 text-center ring-1 ring-gray-200 dark:ring-zinc-800 flex flex-col gap-2">
                <p className="text-gray-700 dark:text-zinc-300 font-medium">No nights match your filters.</p>
                <p className="text-gray-400 dark:text-zinc-500 text-sm">Try adjusting or clearing the filters above.</p>
              </div>
            )}

            {nightsState.status === 'ready' && filtered.length > 0 && (
              <div className="flex flex-col gap-3">
                {filtered.map((night) => (
                  <div
                    key={night.id}
                    ref={(el) => { cardRefs.current[night.id] = el }}
                    className={`rounded-2xl transition-all ${
                      effectiveSelectedId === night.id
                        ? 'ring-2 ring-amber-400'
                        : 'ring-0'
                    }`}
                  >
                    <NightCard
                      night={night}
                      onCardClick={() => handleMarkerSelect(night.id)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile: floating Map toggle pill */}
      {mobileView === 'list' && (
        <button
          onClick={() => setMobileView('map')}
          className="md:hidden fixed bottom-5 left-1/2 -translate-x-1/2 z-[1000] px-5 py-2.5 rounded-full bg-gray-900 dark:bg-zinc-200 text-sm font-semibold text-white dark:text-zinc-900 shadow-lg"
        >
          Map
        </button>
      )}
    </div>
  )
}
