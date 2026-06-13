import type { Schedule } from '../types/comedyNight'

function isScheduleEntry(v: unknown): v is Schedule {
  if (!v || typeof v !== 'object') return false
  const s = v as Record<string, unknown>
  return typeof s.frequency === 'string' && typeof s.startTime === 'string'
}

export function normalizeSchedules(raw: unknown): Schedule[] {
  if (raw == null) return []

  if (Array.isArray(raw)) {
    return raw.filter(isScheduleEntry).filter((s) => {
      if (s.frequency === 'irregular') return true
      return s.weekday !== undefined && s.weekday !== null
    })
  }

  if (isScheduleEntry(raw)) {
    if (raw.frequency !== 'irregular' && (raw.weekday === undefined || raw.weekday === null)) {
      return []
    }
    return [raw]
  }

  return []
}
