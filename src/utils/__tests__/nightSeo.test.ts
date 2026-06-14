import { describe, it, expect } from 'vitest'
import { nightSeo } from '../nightSeo'
import type { ComedyNight } from '../../types/comedyNight'

function makeNight(overrides: Partial<ComedyNight> = {}): ComedyNight {
  return {
    id: 'comedy-virgins',
    name: 'Comedy Virgins',
    description: 'A bringer open mic for brand-new acts in a cosy Stockwell pub.',
    type: 'open-mic',
    levels: ['new'],
    bringer: { required: true },
    schedules: [{ frequency: 'weekly', weekday: 1, startTime: '20:00' }],
    venue: { id: 'v', name: 'Cavendish Arms', address: '128 Hartington Rd', area: 'Stockwell', location: { lat: 0, lng: 0 } },
    howToBook: { contact: '' },
    wheelchairAccessible: null,
    socials: {},
    status: 'active',
    lastVerified: '2026-01-01',
    ...overrides,
  }
}

describe('nightSeo', () => {
  it('builds a keyword-rich title with type and area', () => {
    expect(nightSeo(makeNight()).title).toBe('Comedy Virgins — Open Mic in Stockwell, London | FindComedy')
  })

  it('omits the area phrase when the venue area is empty', () => {
    expect(nightSeo(makeNight({ venue: { ...makeNight().venue, area: '' } })).title).toBe(
      'Comedy Virgins — Open Mic, London | FindComedy',
    )
  })

  it('caps the description at 155 characters', () => {
    const long = makeNight({ description: 'x'.repeat(300) })
    expect(nightSeo(long).description).toHaveLength(155)
  })
})
