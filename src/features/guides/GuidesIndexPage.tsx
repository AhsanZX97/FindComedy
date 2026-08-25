import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { listGuides } from '../../data/guides'
import { useNights } from '../../hooks/useNights'
import { resolveGuideVenues } from '../../utils/guideVenues'
import { useSeo } from '../../hooks/useSeo'
import Header from '../../components/Header'
import GuideThumbnail from './GuideThumbnail'

const TITLE = 'Comedy Guides | FindComedy'
const DESCRIPTION = 'City-by-city guides to comedy nights in London, built from FindComedy\'s own listings.'

function formatGuideDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function GuidesIndexPage() {
  const guides = listGuides()
  const nightsState = useNights()
  const nights = nightsState.status === 'ready' ? nightsState.data : []

  const leadImages = useMemo(() => {
    const map = new Map<string, string | undefined>()
    for (const guide of guides) {
      const [first] = resolveGuideVenues(guide.venues, nights)
      map.set(guide.slug, first?.night.images?.[0] ?? first?.image?.url)
    }
    return map
  }, [guides, nights])

  useSeo({ title: TITLE, description: DESCRIPTION, path: '/guides' })

  return (
    <div className="min-h-dvh flex flex-col bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-white">
      <Header />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8 flex flex-col gap-8">
        <div className="flex flex-col gap-3">
          <h1 className="text-3xl font-display font-bold tracking-tight">Comedy Guides</h1>
          <p className="text-gray-600 dark:text-zinc-400 leading-relaxed">
            City guides built from FindComedy's own listings. Every night in a guide is one you
            can actually click through to and save.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {guides.map((guide) => (
            <Link
              key={guide.slug}
              to={`/guides/${guide.slug}`}
              className="flex gap-4 rounded-2xl bg-white dark:bg-zinc-900 p-4 ring-1 ring-gray-200 dark:ring-zinc-800 hover:ring-amber-400 dark:hover:ring-amber-500 hover:shadow-sm transition-all"
            >
              <GuideThumbnail
                imageUrl={leadImages.get(guide.slug)}
                alt=""
                className="aspect-square w-24 sm:w-28 shrink-0 rounded-xl"
                iconClassName="h-8 w-8 text-amber-500 dark:text-amber-400"
              />

              <div className="flex flex-col gap-1.5 min-w-0">
                <time dateTime={guide.publishedDate} className="text-xs font-medium text-amber-700 dark:text-amber-400">
                  {formatGuideDate(guide.publishedDate)}
                </time>
                <span className="font-display font-bold text-gray-900 dark:text-white leading-snug">
                  {guide.title}
                </span>
                <p className="text-sm text-gray-500 dark:text-zinc-400 leading-snug line-clamp-2">{guide.hook}</p>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}
