import { describe, it, expect } from 'vitest'
import { filterNights, sortByTime } from '../filterNights'
import type { ComedyNight, NightFilters, Schedule } from '../../types/comedyNight'
import { DEFAULT_FILTERS } from '../../types/comedyNight'

const makeNight = (overrides: Partial<ComedyNight>): ComedyNight => ({
  id: 'test-night',
  name: 'Test Night',
  description: 'A test comedy night',
  type: 'open-mic',
  levels: ['new', 'experienced'],
  bringer: { required: false },
  schedules: [{ frequency: 'weekly', weekday: 1, startTime: '20:00' }],
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

const schedules = (...entries: Partial<Schedule>[]): Schedule[] =>
  entries.map((s) => ({ frequency: 'weekly', weekday: 1, startTime: '20:00', ...s }) as Schedule)

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
    const nights = [makeNight({ name: 'Angel Comedy' }), makeNight({ id: 'b', name: 'Banana Cabaret' })]
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

  it('filters by weekday — night with that weekday in schedules is included', () => {
    const nights = [
      makeNight({ id: 'mon', schedules: schedules({ weekday: 1 }) }),
      makeNight({ id: 'wed', schedules: schedules({ weekday: 3 }) }),
    ]
    const result = filterNights(nights, filters({ weekdays: [1] }))
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('mon')
  })

  it('empty weekdays returns all active nights', () => {
    const nights = [
      makeNight({ id: 'mon', schedules: schedules({ weekday: 1 }) }),
      makeNight({ id: 'wed', schedules: schedules({ weekday: 3 }) }),
    ]
    expect(filterNights(nights, filters({ weekdays: [] }))).toHaveLength(2)
  })

  it('multi-select weekdays matches night on any selected day', () => {
    const nights = [
      makeNight({ id: 'mon', schedules: schedules({ weekday: 1 }) }),
      makeNight({ id: 'wed', schedules: schedules({ weekday: 3 }) }),
      makeNight({ id: 'sat', schedules: schedules({ weekday: 6 }) }),
    ]
    const result = filterNights(nights, filters({ weekdays: [1, 3] }))
    expect(result.map((n) => n.id)).toEqual(['mon', 'wed'])
  })

  it('multi-schedule night matches when any schedule falls on a selected day', () => {
    const night = makeNight({
      id: 'multi',
      schedules: schedules({ weekday: 1 }, { weekday: 3 }),
    })
    expect(filterNights([night], filters({ weekdays: [3] }))).toHaveLength(1)
    expect(filterNights([night], filters({ weekdays: [5] }))).toHaveLength(0)
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

  it('area filter matches nights whose venue area normalises to the selected borough', () => {
    const nights = [
      makeNight({ id: 'angel', venue: { id: 'v1', name: 'Pub A', address: '', area: 'Angel', location: { lat: 0, lng: 0 } } }),
      makeNight({ id: 'islington', venue: { id: 'v2', name: 'Pub B', address: '', area: 'Islington', location: { lat: 0, lng: 0 } } }),
      makeNight({ id: 'soho', venue: { id: 'v3', name: 'Pub C', address: '', area: 'Soho', location: { lat: 0, lng: 0 } } }),
    ]
    const result = filterNights(nights, filters({ area: 'Islington' }))
    expect(result.map((n) => n.id)).toEqual(expect.arrayContaining(['angel', 'islington']))
    expect(result.find((n) => n.id === 'soho')).toBeUndefined()
  })

  it('area filter null returns all active nights', () => {
    const nights = [
      makeNight({ id: 'a', venue: { id: 'v1', name: 'A', address: '', area: 'Camden', location: { lat: 0, lng: 0 } } }),
      makeNight({ id: 'b', venue: { id: 'v2', name: 'B', address: '', area: 'Hackney', location: { lat: 0, lng: 0 } } }),
    ]
    expect(filterNights(nights, filters({ area: null }))).toHaveLength(2)
  })

  it('area filter falls back to direct area match when area is not in borough map', () => {
    const nights = [
      makeNight({ id: 'match', venue: { id: 'v1', name: 'A', address: '', area: 'Unknownville', location: { lat: 0, lng: 0 } } }),
      makeNight({ id: 'no-match', venue: { id: 'v2', name: 'B', address: '', area: 'Othertown', location: { lat: 0, lng: 0 } } }),
    ]
    const result = filterNights(nights, filters({ area: 'Unknownville' }))
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('match')
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
  it('sorts nights by earliest start time ascending', () => {
    const nights = [
      makeNight({ id: 'late', schedules: schedules({ startTime: '21:30' }) }),
      makeNight({ id: 'early', schedules: schedules({ startTime: '19:00' }) }),
      makeNight({ id: 'mid', schedules: schedules({ startTime: '20:00' }) }),
    ]
    const result = sortByTime(nights)
    expect(result.map((n) => n.id)).toEqual(['early', 'mid', 'late'])
  })

  it('uses earliest schedule for nights with multiple schedules', () => {
    const nights = [
      makeNight({ id: 'a', schedules: schedules({ startTime: '21:00' }, { startTime: '18:00' }) }),
      makeNight({ id: 'b', schedules: schedules({ startTime: '20:00' }) }),
    ]
    const result = sortByTime(nights)
    expect(result.map((n) => n.id)).toEqual(['a', 'b'])
  })

  it('does not mutate the input array', () => {
    const nights = [
      makeNight({ id: 'b', schedules: schedules({ startTime: '21:00' }) }),
      makeNight({ id: 'a', schedules: schedules({ startTime: '19:00' }) }),
    ]
    const original = [...nights]
    sortByTime(nights)
    expect(nights.map((n) => n.id)).toEqual(original.map((n) => n.id))
  })
})
