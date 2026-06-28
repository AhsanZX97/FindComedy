import { describe, it, expect } from 'vitest'
import { slugify, nightSlug } from '../slug'
import type { ComedyNight } from '../../types/comedyNight'

function makeNight(overrides: Partial<ComedyNight> = {}): ComedyNight {
  return {
    id: 'seed-id',
    name: 'Comedy Virgins',
    description: '',
    type: 'open-mic',
    levels: ['new'],
    bringer: { required: false },
    schedules: [{ frequency: 'weekly', weekday: 1, startTime: '20:00' }],
    venue: {
      id: 'venue-1',
      name: 'Cavendish Arms',
      address: '128 Hartington Rd',
      area: 'Stockwell',
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

describe('slugify', () => {
  it('lowercases and hyphenates words', () => {
    expect(slugify('Angel Comedy')).toBe('angel-comedy')
  })

  it('collapses runs of non-alphanumerics into a single hyphen', () => {
    expect(slugify("The King's Head")).toBe('the-king-s-head')
  })

  it('strips leading and trailing hyphens', () => {
    expect(slugify('  Open Mic!  ')).toBe('open-mic')
  })

  it('truncates to 60 characters', () => {
    const long = 'a'.repeat(80)
    expect(slugify(long)).toHaveLength(60)
  })

  it('returns an empty string for input with no alphanumerics', () => {
    expect(slugify('!!!')).toBe('')
  })
})

describe('nightSlug', () => {
  it('combines the night name, venue name, and area into a keyword-rich slug', () => {
    expect(nightSlug(makeNight())).toBe('comedy-virgins-cavendish-arms-stockwell')
  })

  it('falls back to name + venue when area is empty', () => {
    expect(nightSlug(makeNight({ venue: { ...makeNight().venue, area: '' } }))).toBe('comedy-virgins-cavendish-arms')
  })

  it('falls back to name alone when venue name and area are both empty', () => {
    expect(nightSlug(makeNight({ venue: { ...makeNight().venue, name: '', area: '' } }))).toBe('comedy-virgins')
  })

  it('differentiates two nights with the same name and area but different venues', () => {
    const night1 = makeNight({ venue: { ...makeNight().venue, name: 'Carlton Tavern', area: 'Westminster' } })
    const night2 = makeNight({ venue: { ...makeNight().venue, name: 'The Carlton Tavern', area: 'Westminster' } })
    expect(nightSlug(night1)).not.toBe(nightSlug(night2))
  })

  it('joins multi-word names and areas with hyphens', () => {
    const night = makeNight({ name: "Downstairs at The King's Head", venue: { ...makeNight().venue, area: 'Crouch End' } })
    expect(nightSlug(night)).toBe('downstairs-at-the-king-s-head-cavendish-arms-crouch-end')
  })
})
