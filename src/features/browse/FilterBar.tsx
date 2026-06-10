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
  areas: string[]
  onChange: (filters: NightFilters) => void
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
      onClick={onClick}
      className={`shrink-0 text-sm px-3 py-1.5 rounded-full font-medium transition-colors ${
        active
          ? 'bg-amber-400 text-zinc-950'
          : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white'
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
      onClick={onClick}
      className={`shrink-0 text-sm px-3 py-1.5 rounded-full font-medium border transition-colors ${
        active
          ? 'bg-emerald-900 border-emerald-600 text-emerald-300'
          : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700 hover:text-white'
      }`}
    >
      {children}
    </button>
  )
}

function hasActiveFilters(filters: NightFilters): boolean {
  return (
    filters.search.trim() !== '' ||
    filters.weekday !== null ||
    filters.area !== null ||
    filters.type !== null ||
    filters.level !== null ||
    filters.noBringer ||
    filters.freeEntry
  )
}

export default function FilterBar({ filters, areas, onChange }: FilterBarProps) {
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
          className="w-full rounded-xl bg-zinc-900 border border-zinc-700 px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400/50"
        />
        {filters.search && (
          <button
            onClick={() => set('search', '')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
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
            active={filters.weekday === value}
            onClick={() => toggle('weekday', value, null)}
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
        <span className="shrink-0 w-px bg-zinc-700 mx-1" />
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

      {/* Area select + Toggles */}
      <div className="flex flex-wrap gap-2 items-center">
        <select
          value={filters.area ?? ''}
          onChange={(e) => set('area', e.target.value || null)}
          className="text-sm rounded-xl bg-zinc-900 border border-zinc-700 px-3 py-1.5 text-zinc-300 focus:outline-none focus:ring-2 focus:ring-amber-400/50 cursor-pointer"
        >
          <option value="">All areas</option>
          {areas.map((area) => (
            <option key={area} value={area}>
              {area}
            </option>
          ))}
        </select>

        <TogglePill active={filters.noBringer} onClick={() => set('noBringer', !filters.noBringer)}>
          No bringer
        </TogglePill>

        <TogglePill active={filters.freeEntry} onClick={() => set('freeEntry', !filters.freeEntry)}>
          Free entry
        </TogglePill>

        {hasActiveFilters(filters) && (
          <button
            onClick={() => onChange(DEFAULT_FILTERS)}
            className="text-xs text-zinc-500 hover:text-zinc-300 underline underline-offset-2 ml-auto"
          >
            Clear all
          </button>
        )}
      </div>
    </div>
  )
}
