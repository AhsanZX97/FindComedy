import { describe, it, expect } from 'vitest'
import { resolveGuideVenues } from '../guideVenues'
import type { ComedyNight } from '../../types/comedyNight'
import type { GuideVenueEntry } from '../../types/guide'

function makeNight(overrides: Partial<ComedyNight> = {}): ComedyNight {
  return {
    id: 'night-1',
    name: 'Test Night',
    description: '',
    type: 'showcase',
    levels: ['experienced'],
    bringer: { required: false },
    schedules: [{ frequency: 'weekly', weekday: 3, startTime: '20:00' }],
    venue: {
      id: 'venue-1',
      name: 'Test Venue',
      address: '1 Test St',
      area: 'Hackney',
      location: { lat: 0, lng: 0 },
    },
    howToBook: { contact: '' },
    wheelchairAccessible: null,
    socials: {},
    status: 'active',
    lastVerified: '2026-01-01',
    ...overrides,
  }
}

describe('resolveGuideVenues', () => {
  it('pairs each guide entry with its matching night, in guide order', () => {
    const nights = [makeNight({ id: 'a', name: 'Night A' }), makeNight({ id: 'b', name: 'Night B' })]
    const entries: GuideVenueEntry[] = [
      { nightId: 'b', editorialNote: 'Note B' },
      { nightId: 'a', editorialNote: 'Note A' },
    ]

    const resolved = resolveGuideVenues(entries, nights)

    expect(resolved.map((r) => r.night.name)).toEqual(['Night B', 'Night A'])
    expect(resolved[0].editorialNote).toBe('Note B')
  })

  it('carries the caveat through when present', () => {
    const nights = [makeNight({ id: 'a' })]
    const entries: GuideVenueEntry[] = [{ nightId: 'a', editorialNote: 'Note', caveat: 'Check first' }]

    expect(resolveGuideVenues(entries, nights)[0].caveat).toBe('Check first')
  })

  it('carries the price note through when present', () => {
    const nights = [makeNight({ id: 'a' })]
    const entries: GuideVenueEntry[] = [{ nightId: 'a', editorialNote: 'Note', priceNote: '£5' }]

    expect(resolveGuideVenues(entries, nights)[0].priceNote).toBe('£5')
  })

  it('carries the image through when present', () => {
    const nights = [makeNight({ id: 'a' })]
    const image = { url: '/guides/a.jpg', credit: 'A', creditUrl: 'https://instagram.com/a' }
    const entries: GuideVenueEntry[] = [{ nightId: 'a', editorialNote: 'Note', image }]

    expect(resolveGuideVenues(entries, nights)[0].image).toEqual(image)
  })

  it('drops a guide entry whose nightId has no matching night', () => {
    const nights = [makeNight({ id: 'a' })]
    const entries: GuideVenueEntry[] = [
      { nightId: 'a', editorialNote: 'Note A' },
      { nightId: 'missing', editorialNote: 'Note missing' },
    ]

    expect(resolveGuideVenues(entries, nights)).toHaveLength(1)
  })

  it('returns an empty array when given no nights', () => {
    expect(resolveGuideVenues([{ nightId: 'a', editorialNote: 'Note' }], [])).toEqual([])
  })
})
