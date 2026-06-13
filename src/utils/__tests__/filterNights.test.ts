import { describe, it, expect } from 'vitest'
import { filterNights, sortByTime, getUniqueAreas } from '../filterNights'
import type { ComedyNight, NightFilters } from '../../types/comedyNight'
import { DEFAULT_FILTERS } from '../../types/comedyNight'

const makeNight = (overrides: Partial<ComedyNight>): ComedyNight => ({
  id: 'test-night',
  name: 'Test Night',
  description: 'A test comedy night',
  type: 'open-mic',
  levels: ['new', 'experienced'],
  bringer: { required: false },
  schedule: { frequency: 'weekly', weekday: 1, startTime: '20:00' },
  venue: {
    id: 'test-venue',
    name: 'The Test Pub',
    address: '1 Test St',
    area: 'Islington',
    location: { lat: 51.5, lng: -0.1 },
  },
  howToBook: { contact: '' },
  wheelchairAccessible: null,
  socials: {},
  status: 'active',
  lastVerified: '2026-01-01',
  ...overrides,
})

const filters = (overrides: Partial<NightFilters>): NightFilters => ({
  ...DEFAULT_FILTERS,
  ...overrides,
})

describe('filterNights', () => {
  it('returns all active nights when filters are default', () => {
    const nights = [makeNight({}), makeNight({ id: 'two' })]
    expect(filterNights(nights, DEFAULT_FILTERS)).toHaveLength(2)
  })

  it('excludes paused and gone nights', () => {
    const nights = [
      makeNight({ id: 'active', status: 'active' }),
      makeNight({ id: 'paused', status: 'paused' }),
      makeNight({ id: 'gone', status: 'gone' }),
    ]
    const result = filterNights(nights, DEFAULT_FILTERS)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('active')
  })

  it('filters by search matching name', () => {
    const nights = [makeNight({ name: 'Angel Comedy' }), makeNight({ name: 'Banana Cabaret' })]
    expect(filterNights(nights, filters({ search: 'angel' }))).toHaveLength(1)
    expect(filterNights(nights, filters({ search: 'angel' }))[0].name).toBe('Angel Comedy')
  })

  it('filters by search matching venue area', () => {
    const nights = [
      makeNight({ venue: { id: 'v1', name: 'Pub A', address: '', area: 'Camden', location: { lat: 0, lng: 0 } } }),
      makeNight({ id: 'two', venue: { id: 'v2', name: 'Pub B', address: '', area: 'Brixton', location: { lat: 0, lng: 0 } } }),
    ]
    expect(filterNights(nights, filters({ search: 'camden' }))).toHaveLength(1)
  })

  it('search is case-insensitive', () => {
    const nights = [makeNight({ name: 'Angel Comedy' })]
    expect(filterNights(nights, filters({ search: 'ANGEL' }))).toHaveLength(1)
  })

  it('filters by weekday', () => {
    const nights = [
      makeNight({ id: 'mon', schedule: { frequency: 'weekly', weekday: 1, startTime: '20:00' } }),
      makeNight({ id: 'wed', schedule: { frequency: 'weekly', weekday: 3, startTime: '20:00' } }),
    ]
    const result = filterNights(nights, filters({ weekday: 1 }))
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('mon')
  })

  it('filters by area', () => {
    const nights = [
      makeNight({ venue: { id: 'v1', name: 'A', address: '', area: 'Camden', location: { lat: 0, lng: 0 } } }),
      makeNight({ id: 'two', venue: { id: 'v2', name: 'B', address: '', area: 'Islington', location: { lat: 0, lng: 0 } } }),
    ]
    expect(filterNights(nights, filters({ area: 'Camden' }))).toHaveLength(1)
    expect(filterNights(nights, filters({ area: 'Camden' }))[0].venue.area).toBe('Camden')
  })

  it('filters by type', () => {
    const nights = [
      makeNight({ type: 'open-mic' }),
      makeNight({ id: 'showcase', type: 'showcase' }),
    ]
    expect(filterNights(nights, filters({ type: 'open-mic' }))).toHaveLength(1)
  })

  it('filters by level — includes nights that have the level', () => {
    const nights = [
      makeNight({ levels: ['new'] }),
      makeNight({ id: 'pro-night', levels: ['pro'] }),
      makeNight({ id: 'multi', levels: ['new', 'experienced'] }),
    ]
    const result = filterNights(nights, filters({ level: 'new' }))
    expect(result).toHaveLength(2)
  })

  it('noBringer filter excludes nights that require a bringer', () => {
    const nights = [
      makeNight({ bringer: { required: false } }),
      makeNight({ id: 'bringer-night', bringer: { required: true, count: 2 } }),
    ]
    const result = filterNights(nights, filters({ noBringer: true }))
    expect(result).toHaveLength(1)
    expect(result[0].bringer.required).toBe(false)
  })

  it('returns empty array when no nights match', () => {
    const nights = [makeNight({ name: 'Banana Cabaret' })]
    expect(filterNights(nights, filters({ search: 'zzz-no-match' }))).toHaveLength(0)
  })

  it('combines multiple filters (AND logic)', () => {
    const nights = [
      makeNight({ type: 'open-mic', bringer: { required: false } }),
      makeNight({ id: 'two', type: 'open-mic', bringer: { required: true } }),
      makeNight({ id: 'three', type: 'showcase', bringer: { required: false } }),
    ]
    const result = filterNights(nights, filters({ type: 'open-mic', noBringer: true }))
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('test-night')
  })
})

describe('sortByTime', () => {
  it('sorts nights by start time ascending', () => {
    const nights = [
      makeNight({ id: 'late', schedule: { frequency: 'weekly', weekday: 1, startTime: '21:30' } }),
      makeNight({ id: 'early', schedule: { frequency: 'weekly', weekday: 1, startTime: '19:00' } }),
      makeNight({ id: 'mid', schedule: { frequency: 'weekly', weekday: 1, startTime: '20:00' } }),
    ]
    const result = sortByTime(nights)
    expect(result.map((n) => n.id)).toEqual(['early', 'mid', 'late'])
  })

  it('does not mutate the input array', () => {
    const nights = [
      makeNight({ id: 'b', schedule: { frequency: 'weekly', weekday: 1, startTime: '21:00' } }),
      makeNight({ id: 'a', schedule: { frequency: 'weekly', weekday: 1, startTime: '19:00' } }),
    ]
    const original = [...nights]
    sortByTime(nights)
    expect(nights.map((n) => n.id)).toEqual(original.map((n) => n.id))
  })
})

describe('getUniqueAreas', () => {
  it('returns sorted unique areas', () => {
    const nights = [
      makeNight({ venue: { id: 'v1', name: '', address: '', area: 'Camden', location: { lat: 0, lng: 0 } } }),
      makeNight({ id: 'two', venue: { id: 'v2', name: '', address: '', area: 'Islington', location: { lat: 0, lng: 0 } } }),
      makeNight({ id: 'three', venue: { id: 'v3', name: '', address: '', area: 'Camden', location: { lat: 0, lng: 0 } } }),
    ]
    expect(getUniqueAreas(nights)).toEqual(['Camden', 'Islington'])
  })
})
