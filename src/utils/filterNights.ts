import type { ComedyNight, NightFilters } from '../types/comedyNight'

function matchesSearch(night: ComedyNight, search: string): boolean {
  const q = search.toLowerCase()
  return (
    night.name.toLowerCase().includes(q) ||
    night.venue.name.toLowerCase().includes(q) ||
    night.venue.area.toLowerCase().includes(q) ||
    night.description.toLowerCase().includes(q)
  )
}

export function earliestStartTime(night: ComedyNight): string {
  if (!night.schedules || night.schedules.length === 0) return '99:99'
  return night.schedules.reduce(
    (earliest, s) => (s.startTime < earliest ? s.startTime : earliest),
    night.schedules[0].startTime,
  )
}

export function filterNights(nights: ComedyNight[], filters: NightFilters): ComedyNight[] {
  return nights.filter((night) => {
    if (night.status !== 'active') return false
    if (filters.search.trim() && !matchesSearch(night, filters.search.trim())) return false
    if (
      filters.weekdays.length > 0 &&
      !night.schedules.some((s) => filters.weekdays.includes(s.weekday))
    )
      return false
    if (filters.area !== null && night.venue.area !== filters.area) return false
    if (filters.type !== null && night.type !== filters.type) return false
    if (filters.level !== null && !night.levels.includes(filters.level)) return false
    if (filters.noBringer && night.bringer.required) return false
    return true
  })
}

export function sortByTime(nights: ComedyNight[]): ComedyNight[] {
  return [...nights].sort((a, b) =>
    earliestStartTime(a).localeCompare(earliestStartTime(b)),
  )
}

export function getUniqueAreas(nights: ComedyNight[]): string[] {
  return [...new Set(nights.map((n) => n.venue.area))].sort()
}
