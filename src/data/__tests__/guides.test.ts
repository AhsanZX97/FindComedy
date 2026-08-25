import { describe, it, expect } from 'vitest'
import { getGuideBySlug, listGuides } from '../guides'

describe('listGuides', () => {
  it('returns at least one guide', () => {
    expect(listGuides().length).toBeGreaterThan(0)
  })
})

describe('getGuideBySlug', () => {
  it('returns the guide matching the given slug', () => {
    const guide = getGuideBySlug('best-cheap-comedy-clubs-hackney')
    expect(guide?.city).toBe('Hackney')
  })

  it('returns undefined for a slug that does not exist', () => {
    expect(getGuideBySlug('not-a-real-slug')).toBeUndefined()
  })
})
