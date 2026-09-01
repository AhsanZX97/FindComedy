import { describe, it, expect } from 'vitest'
import { getGuideBySlug, listGuides } from '../guides'

describe('listGuides', () => {
  it('returns at least one guide', () => {
    expect(listGuides().length).toBeGreaterThan(0)
  })

  it('returns guides newest first', () => {
    expect(listGuides().map((guide) => guide.slug)).toEqual([
      'cheap-free-open-mics-camden',
      'best-cheap-comedy-clubs-hackney',
    ])
  })
})

describe('getGuideBySlug', () => {
  it('returns the guide matching the given slug', () => {
    const guide = getGuideBySlug('best-cheap-comedy-clubs-hackney')
    expect(guide?.city).toBe('Hackney')
  })

  it('returns the Camden cheap and free open-mic guide', () => {
    const guide = getGuideBySlug('cheap-free-open-mics-camden')

    expect(guide?.city).toBe('Camden')
    expect(guide?.venues.length).toBeGreaterThan(0)
  })

  it('returns undefined for a slug that does not exist', () => {
    expect(getGuideBySlug('not-a-real-slug')).toBeUndefined()
  })
})
