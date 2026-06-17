import { lazy, Suspense } from 'react'
import { useParams, Link, Navigate, useNavigate } from 'react-router-dom'
import { useNights } from '../../hooks/useNights'
import { getFreshnessLabel, getFreshnessStatus } from '../../utils/freshness'
import type { ComedyNight, NightType, Level, SocialLinks } from '../../types/comedyNight'
import { useAuth } from '../auth/AuthContext'
import { useSocial } from '../social/SocialContext'
import FavouriteButton from '../../components/FavouriteButton'
import CalendarIcon from '../../components/CalendarIcon'
import ReportModal from '../../components/ReportModal'
import ReviewsSection from '../reviews/ReviewsSection'
import Header from '../../components/Header'
import { formatScheduleEntry } from '../../utils/formatSchedule'
import { nightSlug } from '../../utils/slug'
import { buildEventJsonLd } from '../../utils/eventJsonLd'
import { nightSeo } from '../../utils/nightSeo'
import { useSeo, SITE_URL } from '../../hooks/useSeo'

const VenueMiniMap = lazy(() => import('./VenueMiniMap'))


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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold text-gray-900 dark:text-zinc-100">{title}</h2>
      {children}
    </section>
  )
}

function isSafeUrl(url: string): boolean {
  try {
    const { protocol } = new URL(url)
    return protocol === 'https:' || protocol === 'http:'
  } catch {
    return false
  }
}

function SocialRow({ socials }: { socials: SocialLinks }) {
  const links: { label: string; href: string; icon: string }[] = []
  if (socials.website && isSafeUrl(socials.website)) links.push({ label: 'Website', href: socials.website, icon: '🌐' })
  if (socials.instagram && isSafeUrl(socials.instagram)) links.push({ label: 'Instagram', href: socials.instagram, icon: '📸' })
  if (socials.facebook && isSafeUrl(socials.facebook)) links.push({ label: 'Facebook', href: socials.facebook, icon: '👥' })
  if (socials.facebookGroup && isSafeUrl(socials.facebookGroup)) links.push({ label: 'FB Group', href: socials.facebookGroup, icon: '👥' })
  if (socials.tiktok && isSafeUrl(socials.tiktok)) links.push({ label: 'TikTok', href: socials.tiktok, icon: '🎵' })
  if (socials.youtube && isSafeUrl(socials.youtube)) links.push({ label: 'YouTube', href: socials.youtube, icon: '▶️' })

  if (links.length === 0) return <p className="text-sm text-gray-500 dark:text-zinc-400">No social links listed.</p>

  return (
    <div className="flex flex-wrap gap-2">
      {links.map(({ label, href, icon }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-zinc-900 ring-1 ring-gray-200 dark:ring-zinc-800 text-sm text-gray-700 dark:text-zinc-300 hover:text-gray-900 dark:hover:text-white hover:ring-gray-300 dark:hover:ring-zinc-600 transition-colors"
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
    fresh: 'text-emerald-700 dark:text-emerald-400',
    stale: 'text-amber-700 dark:text-amber-400',
    unknown: 'text-red-600 dark:text-red-400',
  }

  const suffix = status === 'unknown' ? ' ⚠️' : ''

  return (
    <span className={`text-xs font-medium ${styles[status]}`}>
      {label}{suffix}
    </span>
  )
}

function BookingTabs({ night }: { night: ComedyNight }) {
  const contact = night.howToBook.contact

  if (!contact) {
    return <p className="text-sm text-gray-500 dark:text-zinc-400">No booking information listed.</p>
  }

  const isUrl = contact.startsWith('http://') || contact.startsWith('https://')

  return (
    <div className="rounded-xl bg-white dark:bg-zinc-900 ring-1 ring-gray-200 dark:ring-zinc-800 p-4 flex flex-col gap-2">
      {isUrl ? (
        <a
          href={contact}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-amber-700 dark:text-amber-400 hover:underline break-all"
        >
          {contact}
        </a>
      ) : (
        <p className="text-sm text-gray-700 dark:text-zinc-300">{contact}</p>
      )}
      {night.bringer.required && (
        <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
          Bringer required{night.bringer.count ? ` — bring ${night.bringer.count} paying guest${night.bringer.count > 1 ? 's' : ''}` : ''}
          {night.bringer.note ? `. ${night.bringer.note}` : ''}
        </p>
      )}
    </div>
  )
}

function NightDetail({ night }: { night: ComedyNight }) {
  const { user, isAdmin } = useAuth()
  const { isFavourite, toggleFavourite } = useSocial()
  const navigate = useNavigate()

  const { title, description } = nightSeo(night)
  useSeo({
    title,
    description,
    path: `/night/${nightSlug(night)}`,
    type: 'article',
    image: night.images?.[0],
    jsonLd: buildEventJsonLd(night, SITE_URL),
  })

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-white">
      <Header />

      <main className="max-w-3xl mx-auto px-4 py-8 flex flex-col gap-8">
        {/* Hero */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="text-xs text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200 transition-colors">
              ← Back to browse
            </Link>
            <div className="flex items-center gap-2">
              <ReportModal
                nightId={night.id}
                userId={user?.id ?? ''}
                isLoggedIn={Boolean(user)}
                onAuthRequired={() => navigate('/auth')}
              />
              {(isAdmin || (user && night.ownerId === user.id)) && (
                <Link
                  to={`/admin/nights/${night.id}`}
                  className="text-xs px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 ring-1 ring-amber-200 dark:ring-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/60 transition-colors font-medium"
                >
                  Edit night
                </Link>
              )}
            </div>
          </div>

          {/* Badges */}
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
            {night.status !== 'active' && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800">
                {night.status === 'paused' ? 'Paused' : 'No longer running'}
              </span>
            )}
          </div>

          <h1 className="text-3xl font-display font-bold text-gray-900 dark:text-white leading-tight text-balance">{night.name}</h1>
          <p className="text-gray-600 dark:text-zinc-300 leading-relaxed">{night.description}</p>

          {/* At a glance: bringer policy is a top decision factor for performers */}
          <div className="flex flex-wrap items-center gap-2">
            {night.bringer.required ? (
              <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800 border border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800">
                Bringer{night.bringer.count ? ` · ${night.bringer.count}` : ''}
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800">
                No bringer
              </span>
            )}
            <FreshnessBadge lastVerified={night.lastVerified} />
          </div>

          {/* Action row */}
          <div className="flex items-center gap-3 flex-wrap pt-1">
            <FavouriteButton
              isFavourited={isFavourite(night.id)}
              onToggle={() => void toggleFavourite(night.id)}
              isLoggedIn={Boolean(user)}
              onAuthRequired={() => navigate('/auth')}
              size="large"
            />
          </div>
        </div>

        <hr className="border-gray-200 dark:border-zinc-800" />

        {/* Schedule */}
        <Section title="Schedule">
          <div className="rounded-xl bg-white dark:bg-zinc-900 ring-1 ring-gray-200 dark:ring-zinc-800 p-4 flex flex-col gap-3">
            {night.schedules.map((s, i) => (
              <div key={i} className="flex flex-col gap-0.5">
                <p className="flex items-center gap-2 text-base font-semibold text-amber-700 dark:text-amber-400">
                  <CalendarIcon className="h-4 w-4 shrink-0" />
                  <span>{formatScheduleEntry(s)}</span>
                </p>
                {s.note && (
                  <p className="text-sm text-gray-500 dark:text-zinc-400 pl-6">{s.note}</p>
                )}
              </div>
            ))}
          </div>
        </Section>

        {/* Venue */}
        <Section title="Venue">
          <div className="rounded-xl bg-white dark:bg-zinc-900 ring-1 ring-gray-200 dark:ring-zinc-800 p-4 flex flex-col gap-1">
            <p className="font-semibold text-gray-900 dark:text-white">{night.venue.name}</p>
            <p className="text-sm text-gray-500 dark:text-zinc-400">{night.venue.address}</p>
            <p className="text-sm text-gray-500 dark:text-zinc-400">
              {night.venue.area}
              {night.venue.nearestStation ? ` · Nearest: ${night.venue.nearestStation}` : ''}
            </p>
          </div>
          <Suspense fallback={<div className="rounded-xl h-48 bg-gray-100 dark:bg-zinc-900 ring-1 ring-gray-200 dark:ring-zinc-800 animate-pulse" />}>
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

        {/* Reviews */}
        <ReviewsSection
          nightId={night.id}
          userId={user?.id ?? null}
          displayName={user?.email?.split('@')[0] ?? 'Anonymous'}
          isAdmin={isAdmin}
          onAuthRequired={() => navigate('/auth')}
        />

        <hr className="border-gray-200 dark:border-zinc-800" />

        {/* Share */}
        <Section title="Share this night">
          <div className="rounded-xl bg-white dark:bg-zinc-900 ring-1 ring-gray-200 dark:ring-zinc-800 p-4 flex flex-col gap-2">
            <p className="text-xs text-gray-500 dark:text-zinc-400">Copy this link to share:</p>
            <code className="text-sm text-amber-700 dark:text-amber-400 break-all">{window.location.href}</code>
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
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
      </div>
    )
  }

  if (nightsState.status === 'error') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-white flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-gray-500 dark:text-zinc-400">{nightsState.message}</p>
        <Link to="/" className="text-amber-700 dark:text-amber-400 text-sm hover:underline">Back to browse</Link>
      </div>
    )
  }

  const night = nightsState.data.find((n) => nightSlug(n) === id || n.id === id)

  if (!night) return <Navigate to="/" replace />

  return <NightDetail night={night} />
}
