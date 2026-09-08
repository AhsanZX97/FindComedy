import { Link } from 'react-router-dom'
import type { ComedyNight } from '../../types/comedyNight'
import { normalizeToBorough } from '../../utils/londonBoroughs'
import { relatedNights } from '../../utils/relatedNights'
import { nightSlug } from '../../utils/slug'

interface RelatedNightsProps {
  night: ComedyNight
  nights: readonly ComedyNight[]
}

export default function RelatedNights({ night, nights }: RelatedNightsProps) {
  const suggestions = relatedNights(nights, night)
  if (suggestions.length === 0) return null

  const borough = normalizeToBorough(night.venue.area)
  const title = borough ? `More comedy nights near ${borough}` : 'More London comedy nights'

  return (
    <section aria-labelledby="related-nights-heading" className="flex flex-col gap-3">
      <h2 id="related-nights-heading" className="font-display text-xl font-bold text-gray-900 dark:text-white text-balance">
        {title}
      </h2>
      <ul className="divide-y divide-gray-200 overflow-hidden rounded-xl bg-white ring-1 ring-gray-200 dark:divide-zinc-800 dark:bg-zinc-900 dark:ring-zinc-800">
        {suggestions.map((suggestion) => (
          <li key={suggestion.id}>
            <Link
              to={`/night/${nightSlug(suggestion)}`}
              className="flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-500 dark:hover:bg-zinc-800"
            >
              <span className="min-w-0">
                <span className="block truncate font-medium text-gray-900 dark:text-white">{suggestion.name}</span>
                <span className="block truncate text-sm text-gray-600 dark:text-zinc-400">{suggestion.venue.name} · {suggestion.venue.area}</span>
              </span>
              <span aria-hidden="true" className="shrink-0 text-amber-700 dark:text-amber-400">→</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
