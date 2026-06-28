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
  venue: { name: string; area: string }
}

/**
 * SEO-friendly slug for a night's URL: night name + venue name + area.
 * Including venue name prevents collisions when two nights share a name and area
 * (e.g. two "Compulsive Comedy" nights both in Westminster).
 */
export function nightSlug(night: SluggableNight): string {
  const base = slugify(night.name)
  const venue = slugify(night.venue.name)
  const area = slugify(night.venue.area)
  const suffix = [venue, area].filter(Boolean).join('-')
  return suffix ? `${base}-${suffix}` : base
}
