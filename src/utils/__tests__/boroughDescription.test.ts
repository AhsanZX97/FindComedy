import { describe, it, expect } from 'vitest'
import { describeBoroughScene } from '../boroughDescription'
import type { ComedyNight } from '../../types/comedyNight'

function makeNight(overrides: Partial<ComedyNight> = {}): ComedyNight {
  return {
    id: 'n1',
    name: 'Some Night',
    description: '',
    type: 'open-mic',
    levels: ['new'],
    bringer: { required: false },
    schedules: [{ frequency: 'weekly', weekday: 2, startTime: '20:00' }],
    venue: {
      id: 'v1',
      name: 'The Venue',
      address: '1 Some St',
      area: 'Hackney',
      location: { lat: 51.5, lng: -0.1 },
    },
    howToBook: { contact: '' },
    wheelchairAccessible: null,
    socials: {},
    status: 'active',
    lastVerified: '2026-05-20',
    ...overrides,
  }
}

describe('describeBoroughScene', () => {
  it('returns a fallback sentence when there are no nights', () => {
    expect(describeBoroughScene('Hackney', [])).toBe('No comedy nights are listed in Hackney yet.')
  })

  it('describes a single night with its type', () => {
    const result = describeBoroughScene('Hackney', [makeNight({ id: 'n1', type: 'open-mic' })])
    expect(result).toContain('Hackney has 1 comedy night listed')
    expect(result).toContain('1 open mic night')
  })

  it('breaks down multiple night types', () => {
    const nights = [
      makeNight({ id: 'n1', type: 'open-mic' }),
      makeNight({ id: 'n2', type: 'open-mic' }),
      makeNight({ id: 'n3', type: 'showcase' }),
    ]
    const result = describeBoroughScene('Hackney', nights)
    expect(result).toContain('Hackney has 3 comedy nights listed')
    expect(result).toContain('2 open mic nights and 1 showcase')
  })

  it('names the weekday most nights share', () => {
    const nights = [
      makeNight({ id: 'n1', schedules: [{ frequency: 'weekly', weekday: 2, startTime: '20:00' }] }),
      makeNight({ id: 'n2', schedules: [{ frequency: 'weekly', weekday: 2, startTime: '19:30' }] }),
      makeNight({ id: 'n3', schedules: [{ frequency: 'weekly', weekday: 4, startTime: '20:00' }] }),
    ]
    const result = describeBoroughScene('Hackney', nights)
    expect(result).toContain('Most run on Tuesdays')
  })

  it('omits the weekday clause when no single day stands out', () => {
    const nights = [
      makeNight({ id: 'n1', schedules: [{ frequency: 'weekly', weekday: 2, startTime: '20:00' }] }),
      makeNight({ id: 'n2', schedules: [{ frequency: 'weekly', weekday: 4, startTime: '20:00' }] }),
    ]
    const result = describeBoroughScene('Hackney', nights)
    expect(result).not.toContain('Most run on')
  })
})
