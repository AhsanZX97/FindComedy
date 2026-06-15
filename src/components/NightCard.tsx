import { Link, useNavigate } from 'react-router-dom'
import type { ComedyNight, NightType, Level } from '../types/comedyNight'
import { useAuth } from '../features/auth/AuthContext'
import { useSocial } from '../features/social/SocialContext'
import FavouriteButton from './FavouriteButton'
import CalendarIcon from './CalendarIcon'
import { formatSchedule } from '../utils/formatSchedule'
import { nightSlug } from '../utils/slug'

const TYPE_STYLES: Record<NightType, string> = {
  'open-mic': 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800',
  showcase: 'bg-violet-50 text-violet-700 border border-violet-200 dark:bg-violet-950 dark:text-violet-300 dark:border-violet-800',
  pro: 'bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800',
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
  footerAction?: React.ReactNode
}

export default function NightCard({ night, onCardClick, footerAction }: NightCardProps) {
  const { user } = useAuth()
  const { isFavourite, toggleFavourite } = useSocial()
  const navigate = useNavigate()
  const scheduleLabel = formatSchedule(night)

  const bodyContent = (
    <>
      {/* Type + Level — the hard scan filters */}
      <div className="flex flex-wrap items-center gap-1.5">
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

      {/* Night name — primary identity, readable ink not accent */}
      <h2 className="text-lg font-display font-bold text-gray-900 dark:text-zinc-50 group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors leading-tight text-balance">
        {night.name}
      </h2>

      {/* Schedule — the scarce, meaningful amber: this is the "when" a performer scans for */}
      {scheduleLabel && (
        <p className="flex items-center gap-1.5 text-sm font-semibold text-amber-700 dark:text-amber-400">
          <CalendarIcon />
          <span>{scheduleLabel}</span>
        </p>
      )}

      {/* Venue */}
      <div className="flex flex-col gap-0.5">
        <span className="text-sm text-gray-700 dark:text-zinc-300">{night.venue.name}</span>
        <span className="text-xs text-gray-400 dark:text-zinc-500">
          {night.venue.area}
          {night.venue.nearestStation ? ` · ${night.venue.nearestStation}` : ''}
        </span>
      </div>

      {/* Footer: bringer chip + optional action */}
      <div className="flex flex-wrap items-center gap-2 mt-auto pt-3 border-t border-gray-100 dark:border-zinc-800">
        {night.bringer.required ? (
          <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800 border border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800">
            Bringer{night.bringer.count ? ` · ${night.bringer.count}` : ''}
          </span>
        ) : (
          <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800">
            No bringer
          </span>
        )}
        {footerAction && <div className="ml-auto">{footerAction}</div>}
      </div>
    </>
  )

  const innerClass =
    'flex flex-col gap-3 p-5 pr-12 text-left w-full rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:focus-visible:ring-amber-400'

  return (
    <div className="group relative flex flex-col rounded-2xl bg-white dark:bg-zinc-900 ring-1 ring-gray-200 dark:ring-zinc-800 hover:ring-gray-300 dark:hover:ring-zinc-700 hover:shadow-sm transition-all duration-150">
      {onCardClick ? (
        <button type="button" onClick={onCardClick} className={innerClass}>
          {bodyContent}
        </button>
      ) : (
        <Link to={`/night/${nightSlug(night)}`} className={innerClass}>
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
