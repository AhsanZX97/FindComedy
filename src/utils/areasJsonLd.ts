import type { ComedyNight } from '../types/comedyNight'
import { nightSlug } from './slug'

export interface AreaListItem {
  name: string
  slug: string
}

/**
 * Schema.org `ItemList` describing the London boroughs covered by `/comedy`, in
 * display order. Shared by the runtime `AreasIndexPage` and the build-time
 * prerenderer so the static HTML and hydrated DOM emit identical structured data.
 */
export function buildAreasItemList(items: AreaListItem[], siteUrl: string): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Open Mic Comedy Nights in London by Borough',
    url: `${siteUrl}/comedy`,
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: `Open Mic Comedy in ${it.name}`,
      url: `${siteUrl}/comedy/${it.slug}`,
    })),
  }
}

/**
 * Schema.org `ItemList` of the nights running in one borough, for `/comedy/:area`.
 * Shared by the runtime `AreaPage` and the build-time prerenderer.
 */
export function buildBoroughItemList(
  boroughName: string,
  boroughSlug: string,
  nights: ComedyNight[],
  siteUrl: string,
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Open Mic Comedy Nights in ${boroughName}, London`,
    url: `${siteUrl}/comedy/${boroughSlug}`,
    numberOfItems: nights.length,
    itemListElement: nights.map((n, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: n.name,
      url: `${siteUrl}/night/${nightSlug(n)}`,
    })),
  }
}
