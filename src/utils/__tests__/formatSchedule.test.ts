import { describe, it, expect } from 'vitest'
import { formatTime, formatSchedule } from '../formatSchedule'
import type { ComedyNight } from '../../types/comedyNight'

function makeNight(overrides: Partial<ComedyNight['schedule']> = {}): ComedyNight {
  return {
    id: 'test',
    name: 'Test Night',
    description: '',
    type: 'open-mic',
    levels: [],
    bringer: { required: false },
    schedule: {
      frequency: 'weekly',
      weekday: 1,
      startTime: '20:00',
      ...overrides,
    },
    venue: {
      id: 'v1',
      name: 'The Pub',
      address: '1 Street',
      area: 'Islington',
      location: { lat: 51.5, lng: -0.1 },
    },
    pricing: { entry: 'Free' },
    howToBook: {},
    socials: {},
    status: 'active',
    lastVerified: '2026-01-01',
  }
}

describe('formatTime', () => {
  it('formats midnight', () => expect(formatTime('00:00')).toBe('12am'))
  it('formats noon', () => expect(formatTime('12:00')).toBe('12pm'))
  it('formats 7pm on the hour', () => expect(formatTime('19:00')).toBe('7pm'))
  it('formats 7:30pm with minutes', () => expect(formatTime('19:30')).toBe('7:30pm'))
  it('formats 1am on the hour', () => expect(formatTime('01:00')).toBe('1am'))
  it('formats 11:45pm', () => expect(formatTime('23:45')).toBe('11:45pm'))
})

describe('formatSchedule', () => {
  it('weekly night', () =>
    expect(formatSchedule(makeNight({ frequency: 'weekly', weekday: 1, startTime: '20:00' }))).toBe('Every Mon · 8pm'))

  it('biweekly night', () =>
    expect(formatSchedule(makeNight({ frequency: 'biweekly', weekday: 4, startTime: '19:30' }))).toBe('Every other Thu · 7:30pm'))

  it('monthly night', () =>
    expect(formatSchedule(makeNight({ frequency: 'monthly', weekday: 5, startTime: '20:30' }))).toBe('Monthly Fri · 8:30pm'))

  it('irregular returns only time', () =>
    expect(formatSchedule(makeNight({ frequency: 'irregular', weekday: 0, startTime: '18:00' }))).toBe('6pm'))
})
