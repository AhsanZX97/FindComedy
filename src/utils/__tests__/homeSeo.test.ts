import { describe, it, expect } from 'vitest'
import { buildHomeJsonLd, HOME_SEO_SECTIONS, homeSeoContentText } from '../homeSeo'

describe('buildHomeJsonLd', () => {
  it('returns a WebSite and an Organization entity', () => {
    const types = buildHomeJsonLd('https://www.findcomedy.xyz').map((e) => e['@type'])
    expect(types).toContain('WebSite')
    expect(types).toContain('Organization')
  })

  it('points every entity url at the site root', () => {
    const ld = buildHomeJsonLd('https://x.test')
    for (const e of ld) expect(e.url).toBe('https://x.test/')
  })

  it('sets schema.org @context on every entity', () => {
    const ld = buildHomeJsonLd('https://x.test')
    for (const e of ld) expect(e['@context']).toBe('https://schema.org')
  })

  it('does not include a SearchAction (no search route yet)', () => {
    const ld = buildHomeJsonLd('https://x.test')
    for (const e of ld) expect(e.potentialAction).toBeUndefined()
  })
})

describe('homepage SEO content', () => {
  it('provides enough useful explanatory copy for the homepage', () => {
    expect(homeSeoContentText().trim().split(/\s+/).length).toBeGreaterThanOrEqual(250)
  })

  it('covers discovery, listings, and borough browsing', () => {
    expect(HOME_SEO_SECTIONS.map((section) => section.heading)).toEqual([
      'Find the right room for your week',
      'Listings checked by people on the circuit',
      'Browse London one borough at a time',
    ])
  })
})
