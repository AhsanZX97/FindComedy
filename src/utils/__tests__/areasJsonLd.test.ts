import { describe, it, expect } from 'vitest'
import { buildBoroughItemList } from '../areasJsonLd'
import type { ComedyNight } from '../../types/comedyNight'

function makeNight(overrides: Partial<ComedyNight> = {}): ComedyNight {
  return {
    id: 'angel-comedy-bill-murray',
    name: 'Angel Comedy',
    description: '',
    type: 'open-mic',
    levels: ['new'],
    bringer: { required: false },
    schedules: [{ frequency: 'weekly', weekday: 1, startTime: '20:00' }],
    venue: {
      id: 'bill-murray',
      name: 'The Bill Murray',
      address: "39 Queen's Head St",
      area: 'Islington',
      location: { lat: 51.5354, lng: -0.1036 },
    },
    howToBook: { contact: '' },
    wheelchairAccessible: null,
    socials: {},
    status: 'active',
    lastVerified: '2026-05-20',
    ...overrides,
  }
}

describe('buildBoroughItemList', () => {
  it('lists each night as a ListItem pointing at its night page', () => {
    const nights = [makeNight()]
    const data = buildBoroughItemList('Islington', 'islington', nights, 'https://www.findcomedy.xyz')
    expect(data['@type']).toBe('ItemList')
    expect(data.url).toBe('https://www.findcomedy.xyz/comedy/islington')
    expect(data.numberOfItems).toBe(1)
    expect(data.itemListElement).toEqual([
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Angel Comedy',
        url: 'https://www.findcomedy.xyz/night/angel-comedy-the-bill-murray-islington',
      },
    ])
  })

  it('numbers items in list order', () => {
    const nights = [makeNight({ id: 'n1', name: 'First' }), makeNight({ id: 'n2', name: 'Second' })]
    const data = buildBoroughItemList('Islington', 'islington', nights, 'https://www.findcomedy.xyz')
    const items = data.itemListElement as Record<string, unknown>[]
    expect(items.map((i) => i.position)).toEqual([1, 2])
  })
})
