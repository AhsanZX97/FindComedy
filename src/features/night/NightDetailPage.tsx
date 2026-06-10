import { lazy, Suspense } from 'react'
import { useParams, Link, Navigate } from 'react-router-dom'
import { useNights } from '../../hooks/useNights'
import { getFreshnessLabel, getFreshnessStatus } from '../../utils/freshness'
import type { ComedyNight, NightType, Level, SocialLinks } from '../../types/comedyNight'

const VenueMiniMap = lazy(() => import('./VenueMiniMap'))

const WEEKDAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500">{title}</h2>
      {children}
    </section>
  )
}

function SocialRow({ socials }: { socials: SocialLinks }) {
  const links: { label: string; href: string; icon: string }[] = []
  if (socials.website) links.push({ label: 'Website', href: socials.website, icon: '🌐' })
  if (socials.instagram) links.push({ label: 'Instagram', href: socials.instagram, icon: '📸' })
  if (socials.facebook) links.push({ label: 'Facebook', href: socials.facebook, icon: '👥' })
  if (socials.facebookGroup) links.push({ label: 'FB Group', href: socials.facebookGroup, icon: '👥' })
  if (socials.tiktok) links.push({ label: 'TikTok', href: socials.tiktok, icon: '🎵' })
  if (socials.youtube) links.push({ label: 'YouTube', href: socials.youtube, icon: '▶️' })

  if (links.length === 0) return <p className="text-sm text-zinc-500">No social links listed.</p>

  return (
    <div className="flex flex-wrap gap-2">
      {links.map(({ label, href, icon }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 ring-1 ring-zinc-800 text-sm text-zinc-300 hover:text-white hover:ring-zinc-600 transition-colors"
        >
          <span>{icon}</span>
          {label}
        </a>
      ))}
    </div>
  )
}

function FreshnessBadge({ lastVerified }: { lastVerified: string }) {
  const status = getFreshnessStatus(lastVerified)
  const label = getFreshnessLabel(lastVerified)

  const styles = {
    fresh: 'text-emerald-400',
    stale: 'text-amber-400',
    unknown: 'text-red-400',
  }

  const suffix = status === 'unknown' ? ' ⚠️' : ''

  return (
    <span className={`text-xs font-medium ${styles[status]}`}>
      {label}{suffix}
    </span>
  )
}

function BookingTabs({ night }: { night: ComedyNight }) {
  const hasAudience = Boolean(night.howToBook.audience)
  const hasPerformers = Boolean(night.howToBook.performers)

  if (!hasAudience && !hasPerformers) {
    return <p className="text-sm text-zinc-500">No booking information listed.</p>
  }

  return (
    <div className="flex flex-col gap-4">
      {hasAudience && (
        <div className="rounded-xl bg-zinc-900 ring-1 ring-zinc-800 p-4 flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
            Getting a ticket
          </span>
          <p className="text-sm text-zinc-200">{night.howToBook.audience}</p>
          {night.pricing.entry && (
            <p className="text-sm font-semibold text-amber-400 mt-1">
              {night.pricing.entry.toLowerCase() === 'free' ? 'Free entry' : night.pricing.entry}
            </p>
          )}
        </div>
      )}
      {hasPerformers && (
        <div className="rounded-xl bg-zinc-900 ring-1 ring-zinc-800 p-4 flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
            Getting a spot (comics)
          </span>
          <p className="text-sm text-zinc-200">{night.howToBook.performers}</p>
          {night.bringer.required && (
            <p className="text-xs text-amber-400 mt-1">
              Bringer required{night.bringer.count ? ` — bring ${night.bringer.count} paying guest${night.bringer.count > 1 ? 's' : ''}` : ''}
              {night.bringer.note ? `. ${night.bringer.note}` : ''}
            </p>
          )}
          {night.pricing.performerPay && night.pricing.performerPay !== 'None' && (
            <p className="text-xs text-emerald-400 mt-1">Pay: {night.pricing.performerPay}</p>
          )}
        </div>
      )}
    </div>
  )
}

function NightDetail({ night }: { night: ComedyNight }) {
  const scheduleFreq = FREQ_LABELS[night.schedule.frequency]
  const scheduleDay = WEEKDAY_LABELS[night.schedule.weekday]
  const scheduleTime = formatTime(night.schedule.startTime)

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-zinc-950/90 backdrop-blur border-b border-zinc-800">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link to="/" className="text-xl font-display font-bold text-amber-400 shrink-0">
            FindComedy
          </Link>
          <span className="text-zinc-700 select-none">/</span>
          <span className="text-sm text-zinc-400 truncate">{night.name}</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 flex flex-col gap-8">
        {/* Hero */}
        <div className="flex flex-col gap-4">
          <Link to="/" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors w-fit">
            ← Back to browse
          </Link>

          {/* Badges */}
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
            {night.status !== 'active' && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-950 text-red-400 border border-red-800">
                {night.status === 'paused' ? 'Paused' : 'No longer running'}
              </span>
            )}
          </div>

          <h1 className="text-3xl font-display font-bold text-white leading-tight">{night.name}</h1>
          <p className="text-zinc-300 leading-relaxed">{night.description}</p>

          <FreshnessBadge lastVerified={night.lastVerified} />
        </div>

        <hr className="border-zinc-800" />

        {/* Schedule */}
        <Section title="Schedule">
          <div className="rounded-xl bg-zinc-900 ring-1 ring-zinc-800 p-4 flex flex-col gap-1">
            <p className="text-base font-semibold text-white">
              {night.schedule.frequency === 'irregular'
                ? scheduleTime
                : `${scheduleFreq} ${scheduleDay} at ${scheduleTime}`}
            </p>
            {night.schedule.note && (
              <p className="text-sm text-zinc-400">{night.schedule.note}</p>
            )}
          </div>
        </Section>

        {/* Venue */}
        <Section title="Venue">
          <div className="rounded-xl bg-zinc-900 ring-1 ring-zinc-800 p-4 flex flex-col gap-1">
            <p className="font-semibold text-white">{night.venue.name}</p>
            <p className="text-sm text-zinc-400">{night.venue.address}</p>
            <p className="text-sm text-zinc-500">
              {night.venue.area}
              {night.venue.nearestStation ? ` · Nearest: ${night.venue.nearestStation}` : ''}
            </p>
          </div>
          <Suspense fallback={<div className="rounded-xl h-48 bg-zinc-900 ring-1 ring-zinc-800 animate-pulse" />}>
            <VenueMiniMap venue={night.venue} />
          </Suspense>
        </Section>

        {/* Booking */}
        <Section title="How to attend">
          <BookingTabs night={night} />
        </Section>

        {/* Socials */}
        <Section title="Find them online">
          <SocialRow socials={night.socials} />
        </Section>

        {/* Share */}
        <Section title="Share this night">
          <div className="rounded-xl bg-zinc-900 ring-1 ring-zinc-800 p-4 flex flex-col gap-2">
            <p className="text-xs text-zinc-500">Copy this link to share:</p>
            <code className="text-sm text-amber-300 break-all">{window.location.href}</code>
          </div>
        </Section>
      </main>
    </div>
  )
}

export default function NightDetailPage() {
  const { id } = useParams<{ id: string }>()
  const nightsState = useNights()

  if (nightsState.status === 'loading') {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
      </div>
    )
  }

  if (nightsState.status === 'error') {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-zinc-400">{nightsState.message}</p>
        <Link to="/" className="text-amber-400 text-sm hover:underline">Back to browse</Link>
      </div>
    )
  }

  const night = nightsState.data.find((n) => n.id === id)

  if (!night) return <Navigate to="/" replace />

  return <NightDetail night={night} />
}
