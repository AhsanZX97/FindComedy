import { describe, it, expect } from 'vitest'
import { getFreshnessLabel, getFreshnessStatus } from '../freshness'

describe('getFreshnessLabel', () => {
  it('returns "Verified today" when lastVerified is today', () => {
    const today = '2026-06-10'
    expect(getFreshnessLabel(today, new Date('2026-06-10'))).toBe('Verified today')
  })

  it('returns "Verified yesterday" when lastVerified is 1 day ago', () => {
    expect(getFreshnessLabel('2026-06-09', new Date('2026-06-10'))).toBe('Verified yesterday')
  })

  it('returns "Verified N days ago" for 2–6 days', () => {
    expect(getFreshnessLabel('2026-06-04', new Date('2026-06-10'))).toBe('Verified 6 days ago')
  })

  it('returns "Verified 1 week ago" for exactly 7 days', () => {
    expect(getFreshnessLabel('2026-06-03', new Date('2026-06-10'))).toBe('Verified 1 week ago')
  })

  it('returns "Verified N weeks ago" for weeks', () => {
    expect(getFreshnessLabel('2026-05-27', new Date('2026-06-10'))).toBe('Verified 2 weeks ago')
  })

  it('returns "Verified N months ago" for 4+ weeks', () => {
    expect(getFreshnessLabel('2026-02-10', new Date('2026-06-10'))).toBe('Verified 4 months ago')
  })
})

describe('getFreshnessStatus', () => {
  it('returns "fresh" when verified within 4 weeks', () => {
    expect(getFreshnessStatus('2026-05-20', new Date('2026-06-10'))).toBe('fresh')
  })

  it('returns "stale" when verified 5 weeks ago', () => {
    expect(getFreshnessStatus('2026-05-06', new Date('2026-06-10'))).toBe('stale')
  })

  it('returns "unknown" when verified more than 8 weeks ago', () => {
    expect(getFreshnessStatus('2026-01-01', new Date('2026-06-10'))).toBe('unknown')
  })
})
