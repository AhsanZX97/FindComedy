import type { NightFilters, NightType, Level, Weekday } from '../../types/comedyNight'
import { DEFAULT_FILTERS } from '../../types/comedyNight'

const DAYS: { label: string; value: Weekday }[] = [
  { label: 'Sun', value: 0 },
  { label: 'Mon', value: 1 },
  { label: 'Tue', value: 2 },
  { label: 'Wed', value: 3 },
  { label: 'Thu', value: 4 },
  { label: 'Fri', value: 5 },
  { label: 'Sat', value: 6 },
]

const TYPES: { label: string; value: NightType }[] = [
  { label: 'Open Mic', value: 'open-mic' },
  { label: 'Showcase', value: 'showcase' },
  { label: 'Pro Night', value: 'pro' },
  { label: 'Mixed Bill', value: 'mixed' },
]

const LEVELS: { label: string; value: Level }[] = [
  { label: 'New Acts', value: 'new' },
  { label: 'Experienced', value: 'experienced' },
  { label: 'Pro', value: 'pro' },
]

interface FilterBarProps {
  filters: NightFilters
  onChange: (filters: NightFilters) => void
  availableAreas?: string[]
}

function PillButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`shrink-0 text-sm px-3.5 py-2 rounded-full font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:focus-visible:ring-amber-400 ${
        active
          ? 'bg-gray-900 text-white dark:bg-amber-400 dark:text-black'
          : 'bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 dark:hover:text-white'
      }`}
    >
      {children}
    </button>
  )
}

function TogglePill({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`shrink-0 text-sm px-3.5 py-2 rounded-full font-medium border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:focus-visible:ring-amber-400 ${
        active
          ? 'bg-emerald-50 border-emerald-400 text-emerald-700 dark:bg-emerald-900 dark:border-emerald-600 dark:text-emerald-300'
          : 'bg-gray-100 border-gray-200 text-gray-600 hover:bg-gray-200 hover:text-gray-900 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-700 dark:hover:text-white'
      }`}
    >
      {children}
    </button>
  )
}

function hasActiveFilters(filters: NightFilters): boolean {
  return (
    filters.search.trim() !== '' ||
    filters.weekdays.length > 0 ||
    filters.type !== null ||
    filters.level !== null ||
    filters.noBringer ||
    filters.area !== null
  )
}

export default function FilterBar({ filters, onChange, availableAreas = [] }: FilterBarProps) {
  function set<K extends keyof NightFilters>(key: K, value: NightFilters[K]) {
    onChange({ ...filters, [key]: value })
  }

  function toggle<K extends keyof NightFilters>(key: K, value: NightFilters[K], offValue: NightFilters[K]) {
    onChange({ ...filters, [key]: filters[key] === value ? offValue : value })
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Search */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search nights, venues, areas..."
          value={filters.search}
          onChange={(e) => set('search', e.target.value)}
          className="w-full rounded-xl bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400/50"
        />
        {filters.search && (
          <button
            onClick={() => set('search', '')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-500 hover:text-gray-700 dark:hover:text-white"
            aria-label="Clear search"
          >
            ×
          </button>
        )}
      </div>

      {/* Days */}
      <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-none">
        {DAYS.map(({ label, value }) => (
          <PillButton
            key={value}
            active={filters.weekdays.includes(value)}
            onClick={() => {
              const next = filters.weekdays.includes(value)
                ? filters.weekdays.filter((d) => d !== value)
                : [...filters.weekdays, value]
              onChange({ ...filters, weekdays: next })
            }}
          >
            {label}
          </PillButton>
        ))}
      </div>

      {/* Types + Levels */}
      <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-none">
        {TYPES.map(({ label, value }) => (
          <PillButton
            key={value}
            active={filters.type === value}
            onClick={() => toggle('type', value, null)}
          >
            {label}
          </PillButton>
        ))}
        <span className="shrink-0 w-px bg-gray-300 dark:bg-zinc-700 mx-1" />
        {LEVELS.map(({ label, value }) => (
          <PillButton
            key={value}
            active={filters.level === value}
            onClick={() => toggle('level', value, null)}
          >
            {label}
          </PillButton>
        ))}
      </div>

      {/* Area */}
      {availableAreas.length > 0 && (
        <div className="relative">
          <select
            value={filters.area ?? ''}
            onChange={(e) => set('area', e.target.value || null)}
            className="w-full appearance-none rounded-xl bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 px-4 py-2.5 pr-9 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400/50"
          >
            <option value="">All areas</option>
            {availableAreas.map((area) => (
              <option key={area} value={area}>{area}</option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-500 text-xs">▾</span>
        </div>
      )}

      {/* Toggles */}
      <div className="flex flex-wrap gap-2 items-center">
        <TogglePill active={filters.noBringer} onClick={() => set('noBringer', !filters.noBringer)}>
          No bringer
        </TogglePill>

        {hasActiveFilters(filters) && (
          <button
            onClick={() => onChange(DEFAULT_FILTERS)}
            className="text-xs text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300 underline underline-offset-2 ml-auto"
          >
            Clear all
          </button>
        )}
      </div>
    </div>
  )
}
