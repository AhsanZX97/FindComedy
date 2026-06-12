import { Link, useNavigate } from 'react-router-dom'
import type { ComedyNight, NightType, Level } from '../types/comedyNight'
import { useAuth } from '../features/auth/AuthContext'
import { useSocial } from '../features/social/SocialContext'
import FavouriteButton from './FavouriteButton'
import { formatSchedule } from '../utils/formatSchedule'

const TYPE_STYLES: Record<NightType, string> = {
  'open-mic': 'bg-blue-950 text-blue-300 border border-blue-800',
  showcase: 'bg-violet-950 text-violet-300 border border-violet-800',
  pro: 'bg-amber-950 text-amber-300 border border-amber-800',
  mixed: 'bg-zinc-800 text-zinc-300 border border-zinc-600',
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
}

export default function NightCard({ night }: NightCardProps) {
  const { user } = useAuth()
  const { isFavourite, toggleFavourite, goingCounts } = useSocial()
  const navigate = useNavigate()
  const scheduleLabel = formatSchedule(night)
  const isFree = night.pricing.entry.toLowerCase() === 'free'
  const goingCount = goingCounts[night.id] ?? 0

  return (
    // Outer div is relative so the FavouriteButton can be absolutely positioned.
    // Link covers the card body; button is a sibling — avoids <button> inside <a>.
    <div className="group relative flex flex-col rounded-2xl bg-zinc-900 ring-1 ring-zinc-800 hover:bg-zinc-800 hover:ring-zinc-700 transition-colors duration-150">
      <Link
        to={`/night/${night.id}`}
        className="flex flex-col gap-3 p-5 pr-12"
      >
        {/* Type + Level badges */}
        <div className="flex flex-wrap gap-1.5">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${TYPE_STYLES[night.type]}`}>
            {TYPE_LABELS[night.type]}
          </span>
          {night.levels.map((level) => (
            <span
              key={level}
              className="text-xs font-medium px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700"
            >
              {LEVEL_LABELS[level]}
            </span>
          ))}
        </div>

        {/* Night name */}
        <h2 className="text-lg font-display font-bold text-amber-400 group-hover:text-amber-300 transition-colors leading-tight">
          {night.name}
        </h2>

        {/* Venue */}
        <div className="flex flex-col gap-0.5">
          <span className="text-sm text-zinc-300">{night.venue.name}</span>
          <span className="text-xs text-zinc-500">
            {night.venue.area}
            {night.venue.nearestStation ? ` · ${night.venue.nearestStation}` : ''}
          </span>
        </div>

        {/* Schedule */}
        <p className="text-sm font-medium text-white">{scheduleLabel}</p>

        {/* Footer: bringer + going count + pricing */}
        <div className="flex flex-wrap items-center gap-2 mt-auto pt-1 border-t border-zinc-800">
          {night.bringer.required ? (
            <span className="text-xs text-amber-400 font-medium">
              Bringer{night.bringer.count ? ` (${night.bringer.count})` : ''}
            </span>
          ) : (
            <span className="text-xs text-emerald-400 font-medium">No bringer</span>
          )}
          {goingCount > 0 && (
            <span className="text-xs text-zinc-500">{goingCount} going</span>
          )}
          <span className="ml-auto text-xs font-semibold">
            {isFree ? (
              <span className="text-emerald-400">Free entry</span>
            ) : (
              <span className="text-zinc-300">{night.pricing.entry}</span>
            )}
          </span>
        </div>
      </Link>

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
