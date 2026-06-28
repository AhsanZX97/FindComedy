import { describe, it, expect } from 'vitest'
import { nextOccurrence, buildEventJsonLd } from '../eventJsonLd'
import type { ComedyNight } from '../../types/comedyNight'

function makeNight(overrides: Partial<ComedyNight> = {}): ComedyNight {
  return {
    id: 'angel-comedy-bill-murray',
    name: 'Angel Comedy',
    description: 'A long-running free comedy night.',
    type: 'open-mic',
    levels: ['new'],
    bringer: { required: false },
    schedules: [{ frequency: 'weekly', weekday: 1, startTime: '20:00' }], // Monday 8pm
    venue: {
      id: 'bill-murray',
      name: 'The Bill Murray',
      address: "39 Queen's Head St",
      area: 'Islington',
      location: { lat: 51.5354, lng: -0.1036 },
    },
    howToBook: { contact: '' },
    wheelchairAccessible: null,
    socials: { website: 'https://angelcomedy.co.uk' },
    status: 'active',
    lastVerified: '2026-05-20',
    ...overrides,
  }
}

describe('nextOccurrence', () => {
  it('returns the next matching weekday at the schedule time', () => {
    // 2026-06-14 is a Sunday (day 0); next Monday (day 1) is 2026-06-15
    const result = nextOccurrence({ frequency: 'weekly', weekday: 1, startTime: '20:00' }, new Date('2026-06-14T12:00:00'))
    expect(result).toBe('2026-06-15T20:00')
  })

  it('returns today when today already matches the weekday', () => {
    // 2026-06-15 is a Monday (day 1)
    const result = nextOccurrence({ frequency: 'weekly', weekday: 1, startTime: '20:00' }, new Date('2026-06-15T09:00:00'))
    expect(result).toBe('2026-06-15T20:00')
  })
})

describe('buildEventJsonLd', () => {
  it('produces a schema.org Event with location, url and startDate', () => {
    const data = buildEventJsonLd(makeNight(), 'https://findcomedy.xyz', new Date('2026-06-14T12:00:00'))
    expect(data['@type']).toBe('Event')
    expect(data.name).toBe('Angel Comedy')
    expect(data.url).toBe('https://findcomedy.xyz/night/angel-comedy-the-bill-murray-islington')
    expect(data.startDate).toBe('2026-06-15T20:00')
    expect((data.location as Record<string, unknown>)['@type']).toBe('Place')
  })

  it('marks a closed night as cancelled', () => {
    const data = buildEventJsonLd(makeNight({ status: 'gone' }), 'https://findcomedy.xyz')
    expect(data.eventStatus).toBe('https://schema.org/EventCancelled')
  })

  it('estimates endDate two hours after the start', () => {
    const data = buildEventJsonLd(makeNight(), 'https://findcomedy.xyz', new Date('2026-06-14T12:00:00'))
    expect(data.endDate).toBe('2026-06-15T22:00')
  })

  it('rolls endDate past midnight for late shows', () => {
    const data = buildEventJsonLd(
      makeNight({ schedules: [{ frequency: 'weekly', weekday: 1, startTime: '23:30' }] }),
      'https://findcomedy.xyz',
      new Date('2026-06-14T12:00:00'),
    )
    expect(data.endDate).toBe('2026-06-16T01:30')
  })

  it('includes a generic performer', () => {
    const data = buildEventJsonLd(makeNight(), 'https://findcomedy.xyz')
    expect((data.performer as Record<string, unknown>)['@type']).toBe('PerformingGroup')
  })

  it('always gives the organizer a url, falling back to the night page', () => {
    const withSite = buildEventJsonLd(makeNight(), 'https://findcomedy.xyz')
    expect((withSite.organizer as Record<string, unknown>).url).toBe('https://angelcomedy.co.uk')

    const noSite = buildEventJsonLd(makeNight({ socials: {} }), 'https://findcomedy.xyz')
    expect((noSite.organizer as Record<string, unknown>).url).toBe(
      'https://findcomedy.xyz/night/angel-comedy-the-bill-murray-islington',
    )
  })

  it('falls back to the site mic image when the night has none', () => {
    const data = buildEventJsonLd(makeNight({ images: [] }), 'https://findcomedy.xyz')
    expect(data.image).toBe('https://findcomedy.xyz/mic.svg')
  })

  it('uses the night image when present', () => {
    const data = buildEventJsonLd(makeNight({ images: ['https://cdn.test/a.jpg'] }), 'https://findcomedy.xyz')
    expect(data.image).toBe('https://cdn.test/a.jpg')
  })

  it('offers a free entry for open-mic nights with a booking url', () => {
    const data = buildEventJsonLd(makeNight({ type: 'open-mic' }), 'https://findcomedy.xyz')
    const offers = data.offers as Record<string, unknown>
    expect(offers['@type']).toBe('Offer')
    expect(offers.availability).toBe('https://schema.org/InStock')
    expect(offers.url).toBe('https://findcomedy.xyz/night/angel-comedy-the-bill-murray-islington')
    expect(offers.price).toBe('0')
    expect(offers.priceCurrency).toBe('GBP')
  })

  it('omits a price for paid night types but still links an offer', () => {
    const data = buildEventJsonLd(makeNight({ type: 'pro' }), 'https://findcomedy.xyz')
    const offers = data.offers as Record<string, unknown>
    expect(offers.url).toBe('https://findcomedy.xyz/night/angel-comedy-the-bill-murray-islington')
    expect(offers.price).toBeUndefined()
  })
})
