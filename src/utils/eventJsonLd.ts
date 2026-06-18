import type { ComedyNight, Schedule, NightStatus } from '../types/comedyNight'
import { nightSlug } from './slug'

const EVENT_STATUS: Record<NightStatus, string> = {
  active: 'https://schema.org/EventScheduled',
  paused: 'https://schema.org/EventPostponed',
  gone: 'https://schema.org/EventCancelled',
}

/** Estimated run length, in hours, used to derive an endDate when none is stored. */
const EVENT_DURATION_HOURS = 2

/** Format a Date as a local naive datetime "YYYY-MM-DDTHH:mm" (no timezone suffix). */
function formatLocal(d: Date): string {
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`
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
 * formatted as a local naive datetime "YYYY-MM-DDTHH:mm" — accepted by
 * schema.org and free of timezone-conversion errors.
 */
export function nextOccurrence(schedule: Schedule, now: Date): string {
  return formatLocal(occurrenceStart(schedule, now))
}

/** Build schema.org Event JSON-LD for a comedy night (for Google rich results). */
export function buildEventJsonLd(night: ComedyNight, siteUrl: string, now: Date = new Date()): Record<string, unknown> {
  const schedule = night.schedules[0]
  const pageUrl = `${siteUrl}/night/${nightSlug(night)}`

  const offers: Record<string, unknown> = {
    '@type': 'Offer',
    url: pageUrl,
    availability: 'https://schema.org/InStock',
  }
  // Open mics are free to attend; paid night types have no stored price, so we
  // link the booking page without asserting a price we don't know.
  if (night.type === 'open-mic') {
    offers.price = '0'
    offers.priceCurrency = 'GBP'
  }

  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: night.name,
    description: night.description,
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    eventStatus: EVENT_STATUS[night.status],
    url: pageUrl,
    image: night.images?.[0] ?? `${siteUrl}/mic.svg`,
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
    offers,
  }

  if (schedule) {
    const start = occurrenceStart(schedule, now)
    data.startDate = formatLocal(start)
    const end = new Date(start)
    end.setHours(end.getHours() + EVENT_DURATION_HOURS)
    data.endDate = formatLocal(end)
  }

  return data
}
