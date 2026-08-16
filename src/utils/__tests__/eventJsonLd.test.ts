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

/** buildEventJsonLd for a night that is expected to produce an Event, narrowed to non-null. */
function mustBuild(...args: Parameters<typeof buildEventJsonLd>): Record<string, unknown> {
  const data = buildEventJsonLd(...args)
  if (!data) throw new Error('expected Event JSON-LD, got none')
  return data
}

describe('nextOccurrence', () => {
  it('returns the next matching weekday at the schedule time', () => {
    // 2026-06-14 is a Sunday (day 0); next Monday (day 1) is 2026-06-15
    const result = nextOccurrence({ frequency: 'weekly', weekday: 1, startTime: '20:00' }, new Date('2026-06-14T12:00:00'))
    expect(result).toBe('2026-06-15T20:00+01:00')
  })

  it('returns today when today already matches the weekday', () => {
    // 2026-06-15 is a Monday (day 1)
    const result = nextOccurrence({ frequency: 'weekly', weekday: 1, startTime: '20:00' }, new Date('2026-06-15T09:00:00'))
    expect(result).toBe('2026-06-15T20:00+01:00')
  })

  it('uses the GMT offset outside British Summer Time', () => {
    // 2026-01-11 is a Sunday; next Monday is 2026-01-12, when London is on GMT
    const result = nextOccurrence({ frequency: 'weekly', weekday: 1, startTime: '20:00' }, new Date('2026-01-11T12:00:00'))
    expect(result).toBe('2026-01-12T20:00+00:00')
  })
})

describe('buildEventJsonLd', () => {
  it('produces a schema.org Event with location, url and startDate', () => {
    const data = mustBuild(makeNight(), 'https://findcomedy.xyz', new Date('2026-06-14T12:00:00'))
    expect(data['@type']).toBe('Event')
    expect(data.name).toBe('Angel Comedy')
    expect(data.url).toBe('https://findcomedy.xyz/night/angel-comedy-the-bill-murray-islington')
    expect(data.startDate).toBe('2026-06-15T20:00+01:00')
    expect((data.location as Record<string, unknown>)['@type']).toBe('Place')
  })

  it('marks a closed night as cancelled', () => {
    const data = mustBuild(makeNight({ status: 'gone' }), 'https://findcomedy.xyz')
    expect(data.eventStatus).toBe('https://schema.org/EventCancelled')
  })

  it('estimates endDate two hours after the start', () => {
    const data = mustBuild(makeNight(), 'https://findcomedy.xyz', new Date('2026-06-14T12:00:00'))
    expect(data.endDate).toBe('2026-06-15T22:00+01:00')
  })

  it('rolls endDate past midnight for late shows', () => {
    const data = mustBuild(
      makeNight({ schedules: [{ frequency: 'weekly', weekday: 1, startTime: '23:30' }] }),
      'https://findcomedy.xyz',
      new Date('2026-06-14T12:00:00'),
    )
    expect(data.endDate).toBe('2026-06-16T01:30+01:00')
  })

  it('includes a generic performer', () => {
    const data = mustBuild(makeNight(), 'https://findcomedy.xyz')
    expect((data.performer as Record<string, unknown>)['@type']).toBe('PerformingGroup')
  })

  it('always gives the organizer a url, falling back to the night page', () => {
    const withSite = mustBuild(makeNight(), 'https://findcomedy.xyz')
    expect((withSite.organizer as Record<string, unknown>).url).toBe('https://angelcomedy.co.uk')

    const noSite = mustBuild(makeNight({ socials: {} }), 'https://findcomedy.xyz')
    expect((noSite.organizer as Record<string, unknown>).url).toBe(
      'https://findcomedy.xyz/night/angel-comedy-the-bill-murray-islington',
    )
  })

  it('falls back to the default share image when the night has none', () => {
    const data = mustBuild(makeNight({ images: [] }), 'https://findcomedy.xyz')
    expect(data.image).toBe('https://findcomedy.xyz/og-image.png')
  })

  it('uses the night image when present', () => {
    const data = mustBuild(makeNight({ images: ['https://cdn.test/a.jpg'] }), 'https://findcomedy.xyz')
    expect(data.image).toBe('https://cdn.test/a.jpg')
  })

  it('offers a free entry for open-mic nights with a booking url', () => {
    const data = mustBuild(makeNight({ type: 'open-mic' }), 'https://findcomedy.xyz')
    const offers = data.offers as Record<string, unknown>
    expect(offers['@type']).toBe('Offer')
    expect(offers.availability).toBe('https://schema.org/InStock')
    expect(offers.url).toBe('https://findcomedy.xyz/night/angel-comedy-the-bill-murray-islington')
    expect(offers.price).toBe('0')
    expect(offers.priceCurrency).toBe('GBP')
  })

  // startDate is required for a valid Event, so a night we cannot date gets no
  // structured data at all rather than an Event Google would reject.
  it('produces no JSON-LD when the night has no schedule', () => {
    expect(buildEventJsonLd(makeNight({ schedules: [] }), 'https://findcomedy.xyz')).toBeNull()
  })

  it('produces no JSON-LD for an irregular schedule with no weekday', () => {
    const night = makeNight({
      schedules: [{ frequency: 'irregular', startTime: '20:00' } as ComedyNight['schedules'][number]],
    })
    expect(buildEventJsonLd(night, 'https://findcomedy.xyz')).toBeNull()
  })

  it('produces no JSON-LD when the start time is unparseable', () => {
    const night = makeNight({ schedules: [{ frequency: 'weekly', weekday: 4, startTime: '0.8125' }] })
    expect(buildEventJsonLd(night, 'https://findcomedy.xyz')).toBeNull()
  })

  // Google requires price and priceCurrency inside an Offer, and we store no price
  // for paid nights — a priceless Offer is invalid, so no Offer is emitted at all.
  it('omits offers entirely for paid night types', () => {
    for (const type of ['pro', 'showcase', 'mixed'] as const) {
      const data = mustBuild(makeNight({ type }), 'https://findcomedy.xyz')
      expect(data.offers).toBeUndefined()
    }
  })
})
