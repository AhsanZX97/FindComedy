import type { ComedyNight, NightType } from '../types/comedyNight'

const TYPE_LABELS: Record<NightType, string> = {
  'open-mic': 'Open Mic',
  showcase: 'Showcase',
  pro: 'Pro Night',
  mixed: 'Mixed Bill',
}

export interface NightSeo {
  title: string
  description: string
}

/**
 * Title and meta description for a night's page. Single source of truth shared by
 * the runtime SEO hook and the build-time prerenderer so the static HTML and the
 * hydrated DOM stay in sync.
 */
export function nightSeo(night: ComedyNight): NightSeo {
  const area = night.venue.area ? ` in ${night.venue.area}` : ''
  return {
    title: `${night.name} — ${TYPE_LABELS[night.type]}${area}, London | FindComedy`,
    description: night.description.slice(0, 155),
  }
}
