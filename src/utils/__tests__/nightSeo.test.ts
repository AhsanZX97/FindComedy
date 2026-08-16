import { describe, it, expect } from 'vitest'
import { nightSeo, TITLE_MAX, DESCRIPTION_MAX } from '../nightSeo'
import type { ComedyNight, Schedule } from '../../types/comedyNight'

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

const schedule = (o: Partial<Schedule> = {}): Schedule => ({
  frequency: 'weekly',
  weekday: 1,
  startTime: '20:00',
  ...o,
})

describe('nightSeo title', () => {
  it('builds a keyword-rich title with type and area', () => {
    expect(nightSeo(makeNight()).title).toBe('Comedy Virgins — Open Mic in Stockwell, London | FindComedy')
  })

  it('omits the area phrase when the venue area is empty', () => {
    expect(nightSeo(makeNight({ venue: { ...makeNight().venue, area: '' } })).title).toBe(
      'Comedy Virgins — Open Mic, London | FindComedy',
    )
  })

  it('drops the redundant area phrase when the night name already contains the area', () => {
    const night = makeNight({
      name: 'Waterloo Comedy Crew',
      venue: { ...makeNight().venue, name: 'The Waterloo Bar', area: 'Waterloo' },
    })
    expect(nightSeo(night).title).toBe('Waterloo Comedy Crew — Open Mic, London | FindComedy')
  })

  it('sheds trailing parts rather than exceed the title budget', () => {
    const night = makeNight({
      name: 'The Extremely Long Comedy Night Extravaganza',
      venue: { ...makeNight().venue, area: 'Shoreditch' },
    })
    const { title } = nightSeo(night)
    expect(title.length).toBeLessThanOrEqual(TITLE_MAX)
    expect(title).toBe('The Extremely Long Comedy Night Extravaganza — Open Mic')
  })

  it('truncates a name that alone exceeds the budget', () => {
    const night = makeNight({ name: 'A'.repeat(90) })
    const { title } = nightSeo(night)
    expect(title.length).toBeLessThanOrEqual(TITLE_MAX)
    expect(title.endsWith('…')).toBe(true)
  })
})

describe('nightSeo description', () => {
  it('leads with the type, venue and schedule', () => {
    expect(nightSeo(makeNight()).description).toBe(
      'Open mic at Cavendish Arms, Stockwell — every Monday, 8pm. Bringer night. A bringer open mic for brand-new acts in a cosy Stockwell pub.',
    )
  })

  it('names both nights when a night runs twice a week', () => {
    const night = makeNight({
      description: '',
      schedules: [schedule({ weekday: 1 }), schedule({ weekday: 4, startTime: '19:30' })],
    })
    expect(nightSeo(night).description).toContain('every Monday, 8pm and every Thursday, 7:30pm')
  })

  it('summarises the tail when a night runs more than twice a week', () => {
    const night = makeNight({
      description: '',
      schedules: [schedule({ weekday: 1 }), schedule({ weekday: 4 }), schedule({ weekday: 6 })],
    })
    expect(nightSeo(night).description).toContain('every Monday, 8pm and 2 more nights')
  })

  it('gives the time only for an irregular schedule', () => {
    const night = makeNight({ description: '', schedules: [schedule({ frequency: 'irregular' })] })
    expect(nightSeo(night).description).toContain('— 8pm.')
  })

  it('states the bringer count when one is set', () => {
    const night = makeNight({ description: '', bringer: { required: true, count: 1 } })
    expect(nightSeo(night).description).toContain('Bringer — bring 1 guest.')
  })

  it('pluralises the bringer count', () => {
    const night = makeNight({ description: '', bringer: { required: true, count: 2 } })
    expect(nightSeo(night).description).toContain('Bringer — bring 2 guests.')
  })

  it('says so when no bringer is required', () => {
    const night = makeNight({ description: '', bringer: { required: false } })
    expect(nightSeo(night).description).toContain('No bringer required.')
  })

  it('still describes the night when it has no prose description', () => {
    const { description } = nightSeo(makeNight({ description: '' }))
    expect(description).toBe('Open mic at Cavendish Arms, Stockwell — every Monday, 8pm. Bringer night.')
  })

  it('still describes the night when it has no schedules', () => {
    const { description } = nightSeo(makeNight({ description: '', schedules: [] }))
    expect(description).toBe('Open mic at Cavendish Arms, Stockwell. Bringer night.')
  })

  it('never exceeds the description budget', () => {
    const night = makeNight({ description: 'word '.repeat(200) })
    expect(nightSeo(night).description.length).toBeLessThanOrEqual(DESCRIPTION_MAX)
  })

  it('clips prose at a word boundary with an ellipsis rather than mid-word', () => {
    const night = makeNight({ description: `${'filler '.repeat(20)}antidisestablishmentarianism` })
    const { description } = nightSeo(night)
    expect(description.endsWith('…')).toBe(true)
    expect(description).not.toContain('antidis')
    expect(description).not.toMatch(/ …$/)
  })

  it('omits prose entirely when too little of the budget is left for it', () => {
    const night = makeNight({
      name: 'x',
      description: 'A bringer open mic for brand-new acts.',
      venue: { ...makeNight().venue, name: 'A Very Long Venue Name Indeed That Eats The Budget Whole', area: 'Some Extremely Long Borough Name Here' },
    })
    expect(nightSeo(night).description).not.toContain('brand-new')
  })
})
