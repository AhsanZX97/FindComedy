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
    expect(data.url).toBe('https://findcomedy.xyz/night/angel-comedy-islington')
    expect(data.startDate).toBe('2026-06-15T20:00')
    expect((data.location as Record<string, unknown>)['@type']).toBe('Place')
  })

  it('marks a closed night as cancelled', () => {
    const data = buildEventJsonLd(makeNight({ status: 'gone' }), 'https://findcomedy.xyz')
    expect(data.eventStatus).toBe('https://schema.org/EventCancelled')
  })
})
