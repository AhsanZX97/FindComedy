import { useMemo } from 'react'
import { useParams, Link, Navigate } from 'react-router-dom'
import { getGuideBySlug } from '../../data/guides'
import { useNights } from '../../hooks/useNights'
import { resolveGuideVenues } from '../../utils/guideVenues'
import { buildGuideJsonLd } from '../../utils/guideJsonLd'
import { useSeo, SITE_URL } from '../../hooks/useSeo'
import Header from '../../components/Header'
import GuideVenueCard from './GuideVenueCard'

function formatGuideDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function GuidePage() {
  const { slug = '' } = useParams<{ slug: string }>()
  const guide = getGuideBySlug(slug)
  const nightsState = useNights()

  const resolved = useMemo(() => {
    if (!guide || nightsState.status !== 'ready') return []
    return resolveGuideVenues(guide.venues, nightsState.data)
  }, [guide, nightsState])

  useSeo({
    title: guide?.metaTitle ?? 'Guide not found | FindComedy',
    description: guide?.metaDescription,
    path: `/guides/${slug}`,
    type: 'article',
    jsonLd: guide ? buildGuideJsonLd(guide, resolved, SITE_URL) : undefined,
  })

  if (!guide) return <Navigate to="/guides" replace />

  return (
    <div className="min-h-dvh flex flex-col bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-white">
      <Header />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8 flex flex-col gap-8">
        <div className="flex flex-col gap-3">
          <h1 className="text-3xl font-display font-bold tracking-tight">{guide.title}</h1>
          <time dateTime={guide.publishedDate} className="text-xs font-medium text-amber-700 dark:text-amber-400">
            Published {formatGuideDate(guide.publishedDate)}
          </time>
          <p className="text-gray-600 dark:text-zinc-400 leading-relaxed">{guide.intro}</p>
          <Link to="/guides" className="text-sm text-amber-700 dark:text-amber-400 hover:underline">
            ← All guides
          </Link>
        </div>

        {nightsState.status === 'loading' && (
          <div className="flex flex-col gap-4">
            {Array.from({ length: guide.venues.length }).map((_, i) => (
              <div key={i} className="h-48 rounded-2xl bg-white dark:bg-zinc-900 ring-1 ring-gray-200 dark:ring-zinc-800 animate-pulse" />
            ))}
          </div>
        )}

        {nightsState.status === 'error' && (
          <div className="rounded-2xl bg-white dark:bg-zinc-900 p-8 text-center ring-1 ring-gray-200 dark:ring-zinc-800">
            <p className="text-gray-500 dark:text-zinc-400">{nightsState.message}</p>
          </div>
        )}

        {nightsState.status === 'ready' && (
          <div className="flex flex-col gap-4">
            {resolved.map((venue) => (
              <GuideVenueCard key={venue.night.id} venue={venue} />
            ))}
          </div>
        )}

        {guide.closingNote && (
          <p className="text-sm text-gray-500 dark:text-zinc-400 leading-relaxed">{guide.closingNote}</p>
        )}

        <Link
          to={`/comedy/${guide.areaSlug}`}
          className="text-sm text-amber-700 dark:text-amber-400 hover:underline"
        >
          See every comedy night in {guide.city} →
        </Link>
      </main>
    </div>
  )
}
