import type { ComedyNight, NightType, Weekday } from '../types/comedyNight'
import { WEEKDAY_LONG_LABELS } from './formatSchedule'

const TYPE_LABELS: Record<NightType, [string, string]> = {
  'open-mic': ['open mic night', 'open mic nights'],
  showcase: ['showcase', 'showcases'],
  pro: ['pro night', 'pro nights'],
  mixed: ['mixed-bill night', 'mixed-bill nights'],
}

const TYPE_ORDER: NightType[] = ['open-mic', 'showcase', 'pro', 'mixed']

function pluralType(type: NightType, count: number): string {
  const [singular, plural] = TYPE_LABELS[type]
  return `${count} ${count === 1 ? singular : plural}`
}

function joinWithAnd(parts: string[]): string {
  if (parts.length <= 1) return parts[0] ?? ''
  if (parts.length === 2) return `${parts[0]} and ${parts[1]}`
  return `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`
}

/** The weekday(s) with the most scheduled occurrences, when one or two days clearly lead. */
function leadingWeekdays(nights: ComedyNight[]): string[] {
  const counts = new Map<Weekday, number>()
  for (const night of nights) {
    for (const s of night.schedules) counts.set(s.weekday, (counts.get(s.weekday) ?? 0) + 1)
  }
  const top = Math.max(0, ...counts.values())
  if (top <= 1) return []
  const leaders = [...counts.entries()].filter(([, c]) => c === top).map(([w]) => WEEKDAY_LONG_LABELS[w])
  return leaders.length <= 2 ? leaders : []
}

/**
 * One data-driven sentence describing a borough's comedy scene — a night-type
 * breakdown plus, when one stands out, the weekday most nights share. Computed from
 * the real listings so every borough page reads differently instead of a single
 * template sentence with the name swapped in.
 */
export function describeBoroughScene(borough: string, nights: ComedyNight[]): string {
  if (nights.length === 0) return `No comedy nights are listed in ${borough} yet.`

  const counts = new Map<NightType, number>()
  for (const night of nights) counts.set(night.type, (counts.get(night.type) ?? 0) + 1)
  const typeParts = TYPE_ORDER.filter((t) => counts.has(t)).map((t) => pluralType(t, counts.get(t)!))

  const nightWord = nights.length === 1 ? 'night' : 'nights'
  const days = leadingWeekdays(nights)
  const dayClause = days.length ? ` Most run on ${joinWithAnd(days.map((d) => `${d}s`))}.` : ''

  return `${borough} has ${nights.length} comedy ${nightWord} listed — ${joinWithAnd(typeParts)}.${dayClause}`
}
