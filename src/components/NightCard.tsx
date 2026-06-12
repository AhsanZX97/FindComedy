import { Link, useNavigate } from 'react-router-dom'
import type { ComedyNight, NightType, Level } from '../types/comedyNight'
import { useAuth } from '../features/auth/AuthContext'
import { useSocial } from '../features/social/SocialContext'
import FavouriteButton from './FavouriteButton'
import { formatSchedule } from '../utils/formatSchedule'

const TYPE_STYLES: Record<NightType, string> = {
  'open-mic': 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800',
  showcase: 'bg-violet-50 text-violet-700 border border-violet-200 dark:bg-violet-950 dark:text-violet-300 dark:border-violet-800',
  pro: 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800',
  mixed: 'bg-gray-100 text-gray-600 border border-gray-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-600',
}

const TYPE_LABELS: Record<NightType, string> = {
  'open-mic': 'Open Mic',
  showcase: 'Showcase',
  pro: 'Pro Night',
  mixed: 'Mixed Bill',
}

const LEVEL_LABELS: Record<Level, string> = {
  new: 'New Acts',
  experienced: 'Experienced',
  pro: 'Pro',
}

interface NightCardProps {
  night: ComedyNight
  onCardClick?: () => void
}

export default function NightCard({ night, onCardClick }: NightCardProps) {
  const { user } = useAuth()
  const { isFavourite, toggleFavourite, goingCounts } = useSocial()
  const navigate = useNavigate()
  const scheduleLabel = formatSchedule(night)
  const isFree = night.pricing.entry.toLowerCase() === 'free'
  const goingCount = goingCounts[night.id] ?? 0

  const bodyContent = (
    <>
      {/* Type + Level badges */}
      <div className="flex flex-wrap gap-1.5">
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${TYPE_STYLES[night.type]}`}>
          {TYPE_LABELS[night.type]}
        </span>
        {night.levels.map((level) => (
          <span
            key={level}
            className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-gray-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700"
          >
            {LEVEL_LABELS[level]}
          </span>
        ))}
      </div>

      {/* Night name */}
      <h2 className="text-lg font-display font-bold text-amber-500 group-hover:text-amber-600 transition-colors leading-tight">
        {night.name}
      </h2>

      {/* Venue */}
      <div className="flex flex-col gap-0.5">
        <span className="text-sm text-gray-700 dark:text-zinc-300">{night.venue.name}</span>
        <span className="text-xs text-gray-400 dark:text-zinc-500">
          {night.venue.area}
          {night.venue.nearestStation ? ` · ${night.venue.nearestStation}` : ''}
        </span>
      </div>

      {/* Schedule */}
      <p className="text-sm font-medium text-gray-900 dark:text-white">{scheduleLabel}</p>

      {/* Footer: bringer + going count + pricing */}
      <div className="flex flex-wrap items-center gap-2 mt-auto pt-1 border-t border-gray-100 dark:border-zinc-800">
        {night.bringer.required ? (
          <span className="text-xs text-amber-600 font-medium">
            Bringer{night.bringer.count ? ` (${night.bringer.count})` : ''}
          </span>
        ) : (
          <span className="text-xs text-emerald-600 font-medium">No bringer</span>
        )}
        {goingCount > 0 && (
          <span className="text-xs text-gray-400 dark:text-zinc-500">{goingCount} going</span>
        )}
        <span className="ml-auto text-xs font-semibold">
          {isFree ? (
            <span className="text-emerald-600">Free entry</span>
          ) : (
            <span className="text-gray-700 dark:text-zinc-300">{night.pricing.entry}</span>
          )}
        </span>
      </div>
    </>
  )

  return (
    <div className="group relative flex flex-col rounded-2xl bg-white dark:bg-zinc-900 ring-1 ring-gray-200 dark:ring-zinc-800 hover:ring-gray-300 dark:hover:ring-zinc-700 hover:shadow-sm transition-all duration-150">
      {onCardClick ? (
        <button
          type="button"
          onClick={onCardClick}
          className="flex flex-col gap-3 p-5 pr-12 text-left w-full"
        >
          {bodyContent}
        </button>
      ) : (
        <Link to={`/night/${night.id}`} className="flex flex-col gap-3 p-5 pr-12">
          {bodyContent}
        </Link>
      )}

      {/* Favourite button — absolutely positioned so it doesn't nest inside <a> */}
      <div className="absolute top-4 right-4 z-10">
        <FavouriteButton
          isFavourited={isFavourite(night.id)}
          onToggle={() => void toggleFavourite(night.id)}
          isLoggedIn={Boolean(user)}
          onAuthRequired={() => navigate('/auth')}
        />
      </div>
    </div>
  )
}
