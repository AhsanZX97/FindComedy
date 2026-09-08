import { describe, expect, it } from 'vitest'
import { relatedNights } from '../relatedNights'
import type { ComedyNight } from '../../types/comedyNight'

function makeNight(id: string, area: string, status: ComedyNight['status'] = 'active'): ComedyNight {
  return {
    id,
    name: id,
    description: '',
    type: 'open-mic',
    levels: ['new'],
    bringer: { required: false },
    schedules: [],
    venue: { id, name: id, address: '', area, location: { lat: 0, lng: 0 } },
    howToBook: { contact: '' },
    wheelchairAccessible: null,
    socials: {},
    status,
    lastVerified: '2026-01-01',
  }
}

describe('relatedNights', () => {
  it('prioritizes active nights in the same borough', () => {
    const current = makeNight('current', 'Camden')
    const sameBorough = makeNight('nearby', 'Kentish Town')
    const elsewhere = makeNight('elsewhere', 'Hackney')

    expect(relatedNights([current, elsewhere, sameBorough], current, 2).map((night) => night.id))
      .toEqual(['nearby', 'elsewhere'])
  })

  it('fills sparse boroughs from other active listings without linking to itself or inactive pages', () => {
    const current = makeNight('current', 'Greenwich')
    const active = makeNight('active', 'Hackney')
    const inactive = makeNight('inactive', 'Camden', 'gone')

    expect(relatedNights([current, inactive, active], current, 3).map((night) => night.id)).toEqual(['active'])
  })
})
