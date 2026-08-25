import { Link } from 'react-router-dom'
import type { ResolvedGuideVenue } from '../../utils/guideVenues'
import { nightSlug } from '../../utils/slug'
import { formatSchedule } from '../../utils/formatSchedule'
import GuideThumbnail from './GuideThumbnail'

export interface GuideVenueCardProps {
  venue: ResolvedGuideVenue
}

export default function GuideVenueCard({ venue: { night, editorialNote, priceNote, caveat, image } }: GuideVenueCardProps) {
  const photo = night.images?.[0]
  return (
    <article className="flex flex-col overflow-hidden rounded-2xl bg-white dark:bg-zinc-900 ring-1 ring-gray-200 dark:ring-zinc-800">
      <GuideThumbnail
        imageUrl={photo ?? image?.url}
        alt={night.name}
        className="aspect-square w-full"
        iconClassName="h-10 w-10 text-amber-500 dark:text-amber-400"
        fit="cover"
        credit={!photo && image ? { label: `Photo: ${image.credit}`, url: image.creditUrl } : undefined}
      />

      <div className="flex flex-col gap-2 p-5">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-lg font-display font-bold text-gray-900 dark:text-white">{night.name}</h2>
          {priceNote && (
            <span className="shrink-0 rounded-full bg-amber-100 dark:bg-amber-900/40 px-2.5 py-1 text-xs font-semibold text-amber-800 dark:text-amber-300">
              {priceNote}
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500 dark:text-zinc-400">{formatSchedule(night)}</p>
        <p className="text-sm text-gray-500 dark:text-zinc-400">
          {night.venue.name}, {night.venue.address}
        </p>
        <p className="text-gray-700 dark:text-zinc-300 leading-relaxed">{editorialNote}</p>

        {caveat && (
          <p className="rounded-lg bg-amber-50 dark:bg-amber-900/20 px-3 py-2 text-sm text-amber-800 dark:text-amber-300">
            ⚠ {caveat}
          </p>
        )}

        <Link
          to={`/night/${nightSlug(night)}`}
          className="mt-1 text-sm font-medium text-amber-700 dark:text-amber-400 hover:underline"
        >
          View on FindComedy →
        </Link>
      </div>
    </article>
  )
}
