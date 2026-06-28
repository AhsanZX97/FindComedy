import { describe, it, expect } from 'vitest'
import { buildHomeJsonLd } from '../homeSeo'

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
