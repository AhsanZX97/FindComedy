import type { ComedyNight, Schedule, NightStatus } from '../types/comedyNight'
import { nightSlug } from './slug'

const EVENT_STATUS: Record<NightStatus, string> = {
  active: 'https://schema.org/EventScheduled',
  paused: 'https://schema.org/EventPostponed',
  gone: 'https://schema.org/EventCancelled',
}

/**
 * Next calendar date (inclusive of today) matching the schedule's weekday,
 * formatted as a local naive datetime "YYYY-MM-DDTHH:mm" — accepted by
 * schema.org and free of timezone-conversion errors.
 */
export function nextOccurrence(schedule: Schedule, now: Date): string {
  const d = new Date(now)
  const diff = (schedule.weekday - d.getDay() + 7) % 7
  d.setDate(d.getDate() + diff)
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}T${schedule.startTime}`
}

/** Build schema.org Event JSON-LD for a comedy night (for Google rich results). */
export function buildEventJsonLd(night: ComedyNight, siteUrl: string, now: Date = new Date()): Record<string, unknown> {
  const schedule = night.schedules[0]
  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: night.name,
    description: night.description,
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    eventStatus: EVENT_STATUS[night.status],
    url: `${siteUrl}/night/${nightSlug(night)}`,
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
      ...(night.socials.website ? { url: night.socials.website } : {}),
    },
  }

  if (schedule) data.startDate = nextOccurrence(schedule, now)
  if (night.images?.[0]) data.image = night.images[0]

  return data
}
