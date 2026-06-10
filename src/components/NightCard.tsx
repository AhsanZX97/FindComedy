import { Link } from 'react-router-dom'
import type { ComedyNight, NightType, Level } from '../types/comedyNight'

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const FREQ_LABELS: Record<string, string> = {
  weekly: 'Every',
  biweekly: 'Every other',
  monthly: 'Monthly',
  irregular: '',
}

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

function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number)
  const suffix = h >= 12 ? 'pm' : 'am'
  const hour = h > 12 ? h - 12 : h === 0 ? 12 : h
  return m === 0 ? `${hour}${suffix}` : `${hour}:${m.toString().padStart(2, '0')}${suffix}`
}

function formatSchedule(night: ComedyNight): string {
  const freq = FREQ_LABELS[night.schedule.frequency]
  const day = WEEKDAY_LABELS[night.schedule.weekday]
  const time = formatTime(night.schedule.startTime)
  if (night.schedule.frequency === 'irregular') return time
  return `${freq} ${day} · ${time}`.trim()
}

interface NightCardProps {
  night: ComedyNight
}

export default function NightCard({ night }: NightCardProps) {
  const scheduleLabel = formatSchedule(night)
  const isFree = night.pricing.entry.toLowerCase() === 'free'

  return (
    <Link
      to={`/night/${night.id}`}
      className="group flex flex-col gap-3 rounded-2xl bg-zinc-900 p-5 hover:bg-zinc-800 transition-colors duration-150 ring-1 ring-zinc-800 hover:ring-zinc-700"
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

      {/* Footer: bringer + pricing */}
      <div className="flex flex-wrap items-center gap-2 mt-auto pt-1 border-t border-zinc-800">
        {night.bringer.required ? (
          <span className="text-xs text-amber-400 font-medium">
            Bringer{night.bringer.count ? ` (${night.bringer.count})` : ''}
          </span>
        ) : (
          <span className="text-xs text-emerald-400 font-medium">No bringer</span>
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
  )
}
