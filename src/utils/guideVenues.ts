import type { ComedyNight } from '../types/comedyNight'
import type { GuideVenueEntry } from '../types/guide'

export interface ResolvedGuideVenue {
  night: ComedyNight
  editorialNote: string
  priceNote?: string
  caveat?: string
  image?: GuideVenueEntry['image']
}

/**
 * Pairs each guide entry with its live FindComedy listing, so guide copy stays a thin
 * editorial layer over the nights database rather than a second, driftable source of
 * facts. An entry whose nightId no longer resolves is dropped rather than shown broken.
 */
export function resolveGuideVenues(entries: GuideVenueEntry[], nights: ComedyNight[]): ResolvedGuideVenue[] {
  const byId = new Map(nights.map((n) => [n.id, n]))
  return entries.flatMap((entry) => {
    const night = byId.get(entry.nightId)
    return night
      ? [
          {
            night,
            editorialNote: entry.editorialNote,
            priceNote: entry.priceNote,
            caveat: entry.caveat,
            image: entry.image,
          },
        ]
      : []
  })
}
