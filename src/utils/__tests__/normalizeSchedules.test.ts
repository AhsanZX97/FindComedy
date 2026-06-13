import { describe, it, expect } from 'vitest'
import { normalizeSchedules } from '../normalizeSchedules'

describe('normalizeSchedules', () => {
  it('wraps a legacy single-object schedule into an array', () => {
    const raw = { frequency: 'weekly', weekday: 3, startTime: '20:00' }
    const result = normalizeSchedules(raw)
    expect(result).toEqual([{ frequency: 'weekly', weekday: 3, startTime: '20:00' }])
  })

  it('passes through a valid array unchanged', () => {
    const raw = [
      { frequency: 'weekly', weekday: 1, startTime: '20:00' },
      { frequency: 'monthly', weekday: 5, startTime: '19:00', note: 'First Friday' },
    ]
    expect(normalizeSchedules(raw)).toEqual(raw)
  })

  it('returns empty array for null', () => {
    expect(normalizeSchedules(null)).toEqual([])
  })

  it('returns empty array for undefined', () => {
    expect(normalizeSchedules(undefined)).toEqual([])
  })

  it('returns empty array for an unexpected type', () => {
    expect(normalizeSchedules('bad')).toEqual([])
    expect(normalizeSchedules(42)).toEqual([])
  })

  it('preserves note field on legacy object', () => {
    const raw = { frequency: 'biweekly', weekday: 2, startTime: '19:30', note: 'Doors 7pm' }
    expect(normalizeSchedules(raw)).toEqual([raw])
  })

  it('filters out entries without weekday when frequency is not irregular', () => {
    const raw = [
      { frequency: 'weekly', startTime: '20:00' },
      { frequency: 'weekly', weekday: 1, startTime: '20:00' },
      { frequency: 'irregular', startTime: '18:00' },
    ]
    const result = normalizeSchedules(raw)
    expect(result).toHaveLength(2)
    expect(result[0].weekday).toBe(1)
    expect(result[1].frequency).toBe('irregular')
  })
})
