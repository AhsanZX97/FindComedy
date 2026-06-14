import { describe, it, expect } from 'vitest'
import { buildSeoTags } from '../seoTags'

function content(metas: { key: string; content: string }[], key: string): string | undefined {
  return metas.find((m) => m.key === key)?.content
}

describe('buildSeoTags', () => {
  it('builds canonical and og:url from baseUrl + path', () => {
    const { canonical, metas } = buildSeoTags({ title: 'T', baseUrl: 'https://www.findcomedy.xyz', path: '/night/x' })
    expect(canonical).toBe('https://www.findcomedy.xyz/night/x')
    expect(content(metas, 'og:url')).toBe('https://www.findcomedy.xyz/night/x')
  })

  it('uses summary card and omits image tags when no image is given', () => {
    const { metas } = buildSeoTags({ title: 'T', baseUrl: 'https://x.test', path: '/' })
    expect(content(metas, 'twitter:card')).toBe('summary')
    expect(content(metas, 'og:image')).toBeUndefined()
    expect(content(metas, 'twitter:image')).toBeUndefined()
  })

  it('resolves a root-relative image against baseUrl and switches to large card', () => {
    const { metas } = buildSeoTags({ title: 'T', baseUrl: 'https://x.test', path: '/', image: '/og.png' })
    expect(content(metas, 'og:image')).toBe('https://x.test/og.png')
    expect(content(metas, 'twitter:card')).toBe('summary_large_image')
  })

  it('keeps an absolute image url as-is', () => {
    const { metas } = buildSeoTags({ title: 'T', baseUrl: 'https://x.test', path: '/', image: 'https://cdn.test/a.jpg' })
    expect(content(metas, 'og:image')).toBe('https://cdn.test/a.jpg')
  })
})
