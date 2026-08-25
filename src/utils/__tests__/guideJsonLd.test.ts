import { describe, it, expect } from 'vitest'
import { buildGuideJsonLd } from '../guideJsonLd'
import type { GuideArticle } from '../../types/guide'
import type { ComedyNight } from '../../types/comedyNight'
import type { ResolvedGuideVenue } from '../guideVenues'

function makeGuide(overrides: Partial<GuideArticle> = {}): GuideArticle {
  return {
    slug: 'best-cheap-comedy-clubs-hackney',
    city: 'Hackney',
    areaSlug: 'hackney',
    title: 'Best Cheap Comedy Clubs in Hackney',
    hook: 'Three cheap comedy nights actually running in Hackney right now.',
    metaTitle: 'Best Cheap Comedy Clubs in Hackney, London | FindComedy',
    metaDescription: 'Cheap and free comedy nights in Hackney, London.',
    publishedDate: '2026-08-25',
    intro: "Hackney's comedy scene runs out of pub back rooms more than proper clubs.",
    venues: [],
    ...overrides,
  }
}

function makeNight(overrides: Partial<ComedyNight> = {}): ComedyNight {
  return {
    id: 'comedy-incorporated-off-the-cuff',
    name: 'Comedy Incorporated: Off The Cuff',
    description: 'A new-material night.',
    type: 'open-mic',
    levels: ['new'],
    bringer: { required: false },
    schedules: [{ frequency: 'weekly', weekday: 2, startTime: '20:00' }],
    venue: {
      id: 'the-hum',
      name: 'The Hum',
      address: '86 Stoke Newington High St',
      area: 'Hackney',
      location: { lat: 51.5616, lng: -0.0748 },
    },
    howToBook: { contact: '' },
    wheelchairAccessible: true,
    socials: {},
    status: 'active',
    lastVerified: '2026-05-20',
    ...overrides,
  }
}

function makeResolved(overrides: Partial<ResolvedGuideVenue> = {}): ResolvedGuideVenue {
  return {
    night: makeNight(),
    editorialNote: "London's biggest new-material circuit.",
    priceNote: 'Free (reserve a seat)',
    ...overrides,
  }
}

describe('buildGuideJsonLd', () => {
  it('produces a schema.org Article with headline, dates and canonical url', () => {
    const data = buildGuideJsonLd(makeGuide(), [makeResolved()], 'https://www.findcomedy.xyz')
    expect(data['@type']).toBe('Article')
    expect(data.headline).toBe('Best Cheap Comedy Clubs in Hackney')
    expect(data.datePublished).toBe('2026-08-25')
    expect(data.dateModified).toBe('2026-08-25')
    expect(data.mainEntityOfPage).toBe('https://www.findcomedy.xyz/guides/best-cheap-comedy-clubs-hackney')
  })

  it('uses the first resolved venue photo as an absolute image url', () => {
    const resolved = [makeResolved({ night: makeNight({ images: ['https://cdn.example.com/photo.jpg'] }) })]
    const data = buildGuideJsonLd(makeGuide(), resolved, 'https://www.findcomedy.xyz')
    expect(data.image).toBe('https://cdn.example.com/photo.jpg')
  })

  it('resolves a root-relative guide image against the site url', () => {
    const resolved = [
      makeResolved({ image: { url: '/guides/comedy-incorporated.jpg', credit: 'x', creditUrl: 'https://x.com' } }),
    ]
    const data = buildGuideJsonLd(makeGuide(), resolved, 'https://www.findcomedy.xyz')
    expect(data.image).toBe('https://www.findcomedy.xyz/guides/comedy-incorporated.jpg')
  })

  it('falls back to the default og image when no venue has one', () => {
    const data = buildGuideJsonLd(makeGuide(), [], 'https://www.findcomedy.xyz')
    expect(data.image).toBe('https://www.findcomedy.xyz/og-image.png')
  })

  it('sets FindComedy as author and publisher', () => {
    const data = buildGuideJsonLd(makeGuide(), [makeResolved()], 'https://www.findcomedy.xyz')
    expect(data.author).toEqual({ '@type': 'Organization', name: 'FindComedy', url: 'https://www.findcomedy.xyz' })
    expect(data.publisher).toMatchObject({ '@type': 'Organization', name: 'FindComedy' })
  })
})
