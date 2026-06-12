import { Navigate } from 'react-router-dom'
import type { ComedyNight } from '../../types/comedyNight'
import { useAuth } from '../auth/AuthContext'
import { useSocial } from '../social/SocialContext'
import { useNights } from '../../hooks/useNights'
import NightCard from '../../components/NightCard'
import Header from '../../components/Header'

function NightGrid({ title, nights, emptyMessage }: {
  title: string
  nights: ComedyNight[]
  emptyMessage: string
}) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500">{title}</h2>
      {nights.length === 0 ? (
        <div className="rounded-2xl bg-zinc-900 ring-1 ring-zinc-800 p-8 text-center">
          <p className="text-zinc-500 text-sm">{emptyMessage}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {nights.map((night) => (
            <NightCard key={night.id} night={night} />
          ))}
        </div>
      )}
    </section>
  )
}

export default function MyNightsPage() {
  const { user, isLoading: authLoading } = useAuth()
  const { favouriteIds, userGoingIds } = useSocial()
  const nightsState = useNights()

  if (authLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!user) return <Navigate to="/auth" replace />

  const allNights = nightsState.status === 'ready' ? nightsState.data : []
  const favouriteNights = allNights.filter((n) => favouriteIds.has(n.id))
  const goingNights = allNights.filter((n) => userGoingIds.has(n.id))

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <Header />
      <main className="max-w-5xl mx-auto px-4 py-8 flex flex-col gap-10">
        <div>
          <h1 className="text-2xl font-display font-bold">My nights</h1>
          <p className="text-sm text-zinc-400 mt-1">Your saved and upcoming comedy nights.</p>
        </div>

        <NightGrid
          title="Favourites"
          nights={favouriteNights}
          emptyMessage="No favourites yet — tap ♡ on any night to save it here."
        />

        <NightGrid
          title="I'm going"
          nights={goingNights}
          emptyMessage="Not going to anything yet — mark yourself as going on a night's detail page."
        />
      </main>
    </div>
  )
}
