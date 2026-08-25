import type { GuideArticle } from '../types/guide'
import type { ResolvedGuideVenue } from './guideVenues'

const DEFAULT_OG_IMAGE = '/og-image.png'

function absoluteImage(url: string, siteUrl: string): string {
  return url.startsWith('http') ? url : siteUrl + url
}

function leadImage(resolved: ResolvedGuideVenue[], siteUrl: string): string {
  const [first] = resolved
  const url = first?.night.images?.[0] ?? first?.image?.url ?? DEFAULT_OG_IMAGE
  return absoluteImage(url, siteUrl)
}

/**
 * Build schema.org Article JSON-LD for a guide page, so it's eligible for Google's
 * article rich results. FindComedy is credited as author/publisher rather than a named
 * person, since guides are an editorial layer over the listings, not bylined writing.
 */
export function buildGuideJsonLd(
  guide: GuideArticle,
  resolved: ResolvedGuideVenue[],
  siteUrl: string,
): Record<string, unknown> {
  const url = `${siteUrl}/guides/${guide.slug}`
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: guide.title,
    description: guide.metaDescription,
    image: leadImage(resolved, siteUrl),
    datePublished: guide.publishedDate,
    dateModified: guide.publishedDate,
    mainEntityOfPage: url,
    url,
    author: { '@type': 'Organization', name: 'FindComedy', url: siteUrl },
    publisher: {
      '@type': 'Organization',
      name: 'FindComedy',
      logo: { '@type': 'ImageObject', url: `${siteUrl}/og-image.png` },
    },
  }
}
