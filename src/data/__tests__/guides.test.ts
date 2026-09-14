import { describe, it, expect } from 'vitest'
import { getGuideBySlug, listGuides } from '../guides'

describe('listGuides', () => {
  it('returns at least one guide', () => {
    expect(listGuides().length).toBeGreaterThan(0)
  })

  it('returns guides newest first', () => {
    expect(listGuides().map((guide) => guide.slug)).toEqual([
      'cheap-comedy-open-mics-westminster',
      'free-comedy-open-mics-islington',
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

  it('returns the Islington free comedy guide with three credited venues', () => {
    const guide = getGuideBySlug('free-comedy-open-mics-islington')

    expect(guide?.city).toBe('Islington')
    expect(guide?.areaSlug).toBe('islington')
    expect(guide?.venues.map((venue) => venue.nightId)).toEqual([
      'slap-and-giggle-coin-laundry',
      'too-far-102-bunhill-row',
      'the-om-194-sussex-way',
    ])
    for (const venue of guide!.venues) {
      expect(venue.priceNote).toMatch(/^Free/)
      expect(venue.image?.url).toMatch(/^\/guides\/.+\.jpg$/)
      expect(venue.image?.credit).toBeTruthy()
      expect(venue.image?.creditUrl).toMatch(/^https:\/\//)
    }
    expect(guide?.venues[2].caveat).toMatch(/start time/)
  })

  it('returns the Westminster guide with three live, priced and self-hosted venues', () => {
    const guide = getGuideBySlug('cheap-comedy-open-mics-westminster')

    expect(guide?.city).toBe('Westminster')
    expect(guide?.areaSlug).toBe('westminster')
    expect(guide?.venues.map((venue) => venue.nightId)).toEqual([
      'virtue-comedy-the-north-star',
      'fool-co-60762c83',
      'king-gong',
    ])
    expect(guide?.venues.map((venue) => venue.image?.url)).toEqual([
      '/guides/virtue-comedy-westminster.jpg',
      '/guides/fool-and-co-westminster.jpg',
      '/guides/king-gong-westminster-square.png',
    ])
    for (const venue of guide!.venues) {
      expect(venue.priceNote).toBeTruthy()
      expect(venue.image?.credit).toBeTruthy()
      expect(venue.image?.creditUrl).toMatch(/^https:\/\//)
    }
  })
})
