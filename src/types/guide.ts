export interface GuideVenueEntry {
  /** ComedyNight.id — the guide entry is resolved from FindComedy's own listing, not editorial facts. */
  nightId: string
  /** Why this night made the list — the guide's added editorial value on top of the raw listing. */
  editorialNote: string
  /** Researched separately from FindComedy's own data, since ComedyNight has no price field. */
  priceNote?: string
  /** Set when a fact about the listing couldn't be fully verified against the venue itself. */
  caveat?: string
  /** A show photo/poster sourced from the night's own social page — self-hosted locally, not hotlinked. */
  image?: {
    url: string
    credit: string
    creditUrl: string
  }
}

export interface GuideArticle {
  slug: string
  city: string
  /** Slug of the matching /comedy/:areaSlug borough page, for a link back to live listings. */
  areaSlug: string
  title: string
  /** Short one-line teaser shown on the guides index card. */
  hook: string
  metaTitle: string
  metaDescription: string
  publishedDate: string
  intro: string
  venues: GuideVenueEntry[]
  closingNote?: string
}
