import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useNights } from '../../hooks/useNights'
import { useSeo, SITE_URL } from '../../hooks/useSeo'
import { slugify } from '../../utils/slug'
import { buildAreasItemList } from '../../utils/areasJsonLd'
import { normalizeToBorough, LONDON_BOROUGHS } from '../../utils/londonBoroughs'
import Header from '../../components/Header'

const TITLE = 'Open Mic Comedy Nights in London by Borough | FindComedy'
const DESCRIPTION =
  'Find open mic comedy nights, showcases and pro nights across every London borough — Camden, Hackney, Islington, Lambeth, Southwark and more. Every listing kept fresh by comedians and audiences who actually go.'

export default function AreasIndexPage() {
  const nightsState = useNights()

  const boroughCounts = useMemo(() => {
    if (nightsState.status !== 'ready') return new Map<string, number>()
    const counts = new Map<string, number>()
    for (const night of nightsState.data) {
      if (night.status !== 'active') continue
      const borough = normalizeToBorough(night.venue.area)
      if (!borough) continue
      counts.set(borough, (counts.get(borough) ?? 0) + 1)
    }
    return counts
  }, [nightsState])

  const withNights = LONDON_BOROUGHS.filter((b) => (boroughCounts.get(b) ?? 0) > 0)
    .sort((a, b) => (boroughCounts.get(b) ?? 0) - (boroughCounts.get(a) ?? 0))

  const jsonLd = useMemo(
    () => buildAreasItemList(withNights.map((b) => ({ name: b, slug: slugify(b) })), SITE_URL),
    [withNights],
  )

  useSeo({
    title: TITLE,
    description: DESCRIPTION,
    path: '/comedy',
    jsonLd,
  })

  const isLoading = nightsState.status === 'loading'

  return (
    <div className="min-h-dvh flex flex-col bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-white">
      <Header />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8 flex flex-col gap-8">
        <div className="flex flex-col gap-3">
          <h1 className="text-3xl font-display font-bold tracking-tight">
            Open Mic Comedy in London
          </h1>
          <p className="text-gray-500 dark:text-zinc-400 leading-relaxed">
            Find open mic comedy nights, showcases and pro nights near you — browse by London
            borough below. Every listing is kept up to date by comedians and audiences who
            actually go.
          </p>
        </div>

        {isLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="h-16 rounded-xl bg-white dark:bg-zinc-900 ring-1 ring-gray-200 dark:ring-zinc-800 animate-pulse" />
            ))}
          </div>
        )}

        {!isLoading && withNights.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {withNights.map((borough) => {
              const count = boroughCounts.get(borough) ?? 0
              return (
                <Link
                  key={borough}
                  to={`/comedy/${slugify(borough)}`}
                  className="flex flex-col gap-1 p-4 rounded-xl bg-white dark:bg-zinc-900 ring-1 ring-gray-200 dark:ring-zinc-800 hover:ring-amber-400 dark:hover:ring-amber-500 hover:shadow-sm transition-all"
                >
                  <span className="font-semibold text-sm text-gray-900 dark:text-white leading-snug">
                    {borough}
                  </span>
                  <span className="text-xs text-amber-700 dark:text-amber-400">
                    {count} {count === 1 ? 'night' : 'nights'}
                  </span>
                </Link>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
