const SITE_NAME = 'FindComedy'

export const HOME_TITLE = 'Open Mic Comedy in London | FindComedy'
export const HOME_DESCRIPTION =
  'Find open mic comedy nights, showcases and pro nights across London. Browse by day, area and type — every listing kept fresh by the people who actually go.'

export interface HomeSeoSection {
  heading: string
  paragraphs: readonly string[]
}

// This copy gives first-time visitors (and non-JavaScript crawlers) useful context
// without getting in the way of the live listings, which remain the homepage's focus.
export const HOME_SEO_SECTIONS: readonly HomeSeoSection[] = [
  {
    heading: 'Find the right room for your week',
    paragraphs: [
      'FindComedy is for comics who need the facts before they leave the house: where a night is, who it suits, when it starts and whether there is a bringer. Use the filters to narrow London comedy nights by day, borough, night type or level, then open a listing for its full schedule, venue and booking details.',
      'Whether you are looking for a first open-mic slot, somewhere to test new material, a showcase to watch, or a proper pro bill, the point is to make a decision quickly. The map is there when geography matters; the list is there when the details matter more.',
    ],
  },
  {
    heading: 'Listings checked by people on the circuit',
    paragraphs: [
      'A comedy night can change venue, time, booking method or bringer rule with very little warning. FindComedy keeps the practical bits together and makes it easy to flag a listing that has gone stale. We would rather show a clear unknown than pretend a detail is reliable.',
      'Each listing tells you the venue, nearest station where we have it, the kind of room it is and the level it tends to suit. If you run a London comedy night that is missing, you can submit it for review so other comics and audiences can find it too.',
    ],
  },
  {
    heading: 'Browse London one borough at a time',
    paragraphs: [
      'London comedy is local. A good room in Camden is not much use if your last train leaves from Lewisham, and a midweek open mic in Hackney may be exactly what you need. Browse the borough pages to see every active listing in an area, then use the individual night pages to compare the practical details.',
      'The directory covers open mics, showcases, pro nights and the mixed rooms in between. It is built for the people who perform, promote and watch comedy here — no ticketing clutter, just the information that helps you work out where to go next.',
    ],
  },
]

export function homeSeoContentText(): string {
  return HOME_SEO_SECTIONS.flatMap((section) => [section.heading, ...section.paragraphs]).join(' ')
}
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
