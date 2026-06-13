import { describe, it, expect } from 'vitest'
import { formatTime, formatScheduleEntry, formatSchedule } from '../formatSchedule'
import type { ComedyNight, Schedule } from '../../types/comedyNight'

function makeNight(schedules: Partial<Schedule>[] = [{}]): ComedyNight {
  return {
    id: 'test',
    name: 'Test Night',
    description: '',
    type: 'open-mic',
    levels: [],
    bringer: { required: false },
    schedules: schedules.map((s) => ({
      frequency: 'weekly',
      weekday: 1,
      startTime: '20:00',
      ...s,
    })) as Schedule[],
    venue: {
      id: 'v1',
      name: 'The Pub',
      address: '1 Street',
      area: 'Islington',
      location: { lat: 51.5, lng: -0.1 },
    },
    howToBook: { contact: '' },
    wheelchairAccessible: null,
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
  it('passes through already-formatted 12h times without crashing', () => {
    expect(formatTime('7pm')).toBe('7pm')
    expect(formatTime('8:30pm')).toBe('8:30pm')
    expect(formatTime('11am')).toBe('11am')
  })
  it('returns empty string for empty input', () => expect(formatTime('')).toBe(''))
})

describe('formatScheduleEntry', () => {
  it('weekly entry', () =>
    expect(formatScheduleEntry({ frequency: 'weekly', weekday: 1, startTime: '20:00' })).toBe('Every Mon · 8pm'))

  it('biweekly entry', () =>
    expect(formatScheduleEntry({ frequency: 'biweekly', weekday: 4, startTime: '19:30' })).toBe('Every other Thu · 7:30pm'))

  it('monthly entry', () =>
    expect(formatScheduleEntry({ frequency: 'monthly', weekday: 5, startTime: '20:30' })).toBe('Monthly Fri · 8:30pm'))

  it('irregular entry returns only time', () =>
    expect(formatScheduleEntry({ frequency: 'irregular', weekday: 0, startTime: '18:00' })).toBe('6pm'))
})

describe('formatSchedule', () => {
  it('single-schedule night (unchanged output)', () =>
    expect(formatSchedule(makeNight([{ frequency: 'weekly', weekday: 1, startTime: '20:00' }]))).toBe('Every Mon · 8pm'))

  it('two-schedule night joins with dot separator', () =>
    expect(
      formatSchedule(makeNight([
        { frequency: 'weekly', weekday: 1, startTime: '20:00' },
        { frequency: 'weekly', weekday: 3, startTime: '20:00' },
      ]))
    ).toBe('Every Mon · 8pm · Every Wed · 8pm'))

  it('three-schedule night shows first two and +N more', () =>
    expect(
      formatSchedule(makeNight([
        { frequency: 'weekly', weekday: 1, startTime: '20:00' },
        { frequency: 'weekly', weekday: 3, startTime: '20:00' },
        { frequency: 'monthly', weekday: 5, startTime: '19:00' },
      ]))
    ).toBe('Every Mon · 8pm · Every Wed · 8pm +1 more'))

  it('irregular entry in multi-schedule night shows time only for that entry', () =>
    expect(
      formatSchedule(makeNight([
        { frequency: 'irregular', weekday: 0, startTime: '18:00' },
        { frequency: 'weekly', weekday: 2, startTime: '20:00' },
      ]))
    ).toBe('6pm · Every Tue · 8pm'))

  it('empty schedules returns empty string', () =>
    expect(formatSchedule(makeNight([]))).toBe(''))
})
