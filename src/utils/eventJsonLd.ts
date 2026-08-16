import type { ComedyNight, Schedule, NightStatus } from '../types/comedyNight'
import { nightSlug } from './slug'

const EVENT_STATUS: Record<NightStatus, string> = {
  active: 'https://schema.org/EventScheduled',
  paused: 'https://schema.org/EventPostponed',
  gone: 'https://schema.org/EventCancelled',
}

/** Estimated run length, in hours, used to derive an endDate when none is stored. */
const EVENT_DURATION_HOURS = 2

/**
 * UTC offset Europe/London is on at the given wall-clock moment: "+01:00" during
 * British Summer Time, "+00:00" on GMT. Derived from the wall-clock fields rather
 * than the Date's instant, so the result does not depend on the build machine's
 * own timezone.
 */
function londonOffset(d: Date): string {
  const instant = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes()))
  const label = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', timeZoneName: 'longOffset' })
    .formatToParts(instant)
    .find((part) => part.type === 'timeZoneName')?.value
  // On GMT the label is a bare "GMT" with no numeric offset to match.
  return label?.match(/[+-]\d{2}:\d{2}/)?.[0] ?? '+00:00'
}

/**
 * Format a Date as "YYYY-MM-DDTHH:mm+01:00" — the wall-clock time as scheduled,
 * with London's UTC offset appended. Google warns on datetimes without one.
 */
function formatLondon(d: Date): string {
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}T${hh}:${min}${londonOffset(d)}`
}

/** Next calendar date (inclusive of today) matching the schedule's weekday, at its start time. */
function occurrenceStart(schedule: Schedule, now: Date): Date {
  const d = new Date(now)
  const diff = (schedule.weekday - d.getDay() + 7) % 7
  d.setDate(d.getDate() + diff)
  const [h, m] = schedule.startTime.split(':').map(Number)
  d.setHours(h, m, 0, 0)
  return d
}

/**
 * Next calendar date (inclusive of today) matching the schedule's weekday,
 * formatted as a London-offset datetime "YYYY-MM-DDTHH:mm+01:00".
 */
export function nextOccurrence(schedule: Schedule, now: Date): string {
  return formatLondon(occurrenceStart(schedule, now))
}

/**
 * Build schema.org Event JSON-LD for a comedy night (for Google rich results).
 *
 * Returns null when the night has no datable occurrence — no schedule, an irregular
 * one with no weekday, or an unparseable start time. startDate is a required Event
 * field, so emitting nothing keeps those pages out of Google's invalid-item reports.
 */
export function buildEventJsonLd(
  night: ComedyNight,
  siteUrl: string,
  now: Date = new Date(),
): Record<string, unknown> | null {
  const schedule = night.schedules[0]
  if (!schedule) return null

  const start = occurrenceStart(schedule, now)
  if (Number.isNaN(start.getTime())) return null

  const pageUrl = `${siteUrl}/night/${nightSlug(night)}`

  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: night.name,
    description: night.description,
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    eventStatus: EVENT_STATUS[night.status],
    url: pageUrl,
    image: night.images?.[0] ?? `${siteUrl}/og-image.png`,
    location: {
      '@type': 'Place',
      name: night.venue.name,
      address: {
        '@type': 'PostalAddress',
        streetAddress: night.venue.address,
        addressLocality: night.venue.area || 'London',
        addressRegion: 'London',
        addressCountry: 'GB',
      },
      geo: {
        '@type': 'GeoCoordinates',
        latitude: night.venue.location.lat,
        longitude: night.venue.location.lng,
      },
    },
    organizer: {
      '@type': 'Organization',
      name: night.name,
      url: night.socials.website ?? pageUrl,
    },
    performer: {
      '@type': 'PerformingGroup',
      name: 'Live stand-up comedians',
    },
  }

  // Google requires price and priceCurrency inside an Offer. Open mics are free to
  // attend, so we can state that; paid nights have no stored price, and a priceless
  // Offer is invalid structured data — better to emit none than an incomplete one.
  if (night.type === 'open-mic') {
    data.offers = {
      '@type': 'Offer',
      url: pageUrl,
      availability: 'https://schema.org/InStock',
      price: '0',
      priceCurrency: 'GBP',
    }
  }

  data.startDate = formatLondon(start)
  const end = new Date(start)
  end.setHours(end.getHours() + EVENT_DURATION_HOURS)
  data.endDate = formatLondon(end)

  return data
}
