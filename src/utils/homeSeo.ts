const SITE_NAME = 'FindComedy'

export const HOME_TITLE = 'Open Mic Comedy in London | FindComedy'
export const HOME_DESCRIPTION =
  'Find open mic comedy nights, showcases and pro nights across London. Browse by day, area and type — every listing kept fresh by the people who actually go.'
/** Default homepage social share image. Replace with a 1200×630 raster (SEO checklist #4). */
export const HOME_IMAGE = '/mic.svg'

/**
 * Brand-level structured data for the homepage: a `WebSite` entity and the
 * `Organization` that maintains it. Strengthens entity/brand recognition for
 * the site as a whole. (No `SearchAction` until a real text-search route exists.)
 * Shared by the runtime `useSeo` hook and the build-time prerenderer so the
 * static HTML and hydrated DOM stay in sync.
 */
export function buildHomeJsonLd(siteUrl: string): Record<string, unknown>[] {
  const home = `${siteUrl}/`
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: SITE_NAME,
      url: home,
      description: HOME_DESCRIPTION,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: SITE_NAME,
      url: home,
      logo: `${siteUrl}/mic.svg`,
    },
  ]
}
