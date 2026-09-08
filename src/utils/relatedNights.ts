import type { ComedyNight } from '../types/comedyNight'
import { normalizeToBorough } from './londonBoroughs'

/**
 * Returns useful alternative listings while keeping every active night linked from
 * more than one context. Borough neighbours come first; the wider directory fills
 * any sparse borough so a single-listing area does not become an SEO dead end.
 */
export function relatedNights(
  nights: readonly ComedyNight[],
  currentNight: ComedyNight,
  limit = 3,
): ComedyNight[] {
  const borough = normalizeToBorough(currentNight.venue.area)
  const candidates = nights.filter((night) => night.status === 'active' && night.id !== currentNight.id)
  const local = borough
    ? candidates.filter((night) => normalizeToBorough(night.venue.area) === borough)
    : []
  const widerLondon = candidates.filter((night) => !local.includes(night))

  return [...local, ...widerLondon].slice(0, limit)
}
