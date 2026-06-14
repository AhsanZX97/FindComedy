/**
 * Turn arbitrary text into a URL-safe kebab-case slug.
 * Collapses runs of non-alphanumerics to a single hyphen and caps length.
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

/** Minimal shape needed to build a night's slug (satisfied by ComedyNight and raw DB rows). */
export interface SluggableNight {
  name: string
  venue: { area: string }
}

/**
 * SEO-friendly slug for a night's URL: the night name plus its venue area,
 * so the path itself carries keywords (e.g. "comedy-virgins-stockwell").
 * Deterministic and collision-resistant without needing a stored slug field.
 */
export function nightSlug(night: SluggableNight): string {
  const base = slugify(night.name)
  const area = slugify(night.venue.area)
  return area ? `${base}-${area}` : base
}
