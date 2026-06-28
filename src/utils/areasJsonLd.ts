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
