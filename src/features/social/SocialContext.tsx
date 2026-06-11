import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { useAuth } from '../auth/AuthContext'
import { getFavouriteNightIds, addFavourite, removeFavourite } from '../../services/favouritesService'
import { getGoingCounts, getUserGoingNightIds, toggleAttendance } from '../../services/attendanceService'

export interface SocialContextValue {
  favouriteIds: Set<string>
  userGoingIds: Set<string>
  goingCounts: Record<string, number>
  isFavourite: (nightId: string) => boolean
  isGoing: (nightId: string) => boolean
  toggleFavourite: (nightId: string) => Promise<void>
  toggleGoing: (nightId: string) => Promise<void>
  isLoading: boolean
}

const SocialContext = createContext<SocialContextValue | null>(null)

export function SocialProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [favouriteIds, setFavouriteIds] = useState<Set<string>>(new Set())
  const [userGoingIds, setUserGoingIds] = useState<Set<string>>(new Set())
  const [goingCounts, setGoingCounts] = useState<Record<string, number>>({})
  const [isLoading, setIsLoading] = useState(false)

  // Going counts are public — fetch once on mount
  useEffect(() => {
    getGoingCounts().then(setGoingCounts).catch(() => {})
  }, [])

  // User-specific data resets on sign-out, loads on sign-in
  useEffect(() => {
    if (!user) {
      setFavouriteIds(new Set())
      setUserGoingIds(new Set())
      return
    }
    setIsLoading(true)
    Promise.all([getFavouriteNightIds(user.id), getUserGoingNightIds(user.id)])
      .then(([favIds, goingIds]) => {
        setFavouriteIds(new Set(favIds))
        setUserGoingIds(new Set(goingIds))
      })
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [user?.id])

  const isFavourite = useCallback((nightId: string) => favouriteIds.has(nightId), [favouriteIds])
  const isGoing = useCallback((nightId: string) => userGoingIds.has(nightId), [userGoingIds])

  const toggleFavourite = useCallback(
    async (nightId: string) => {
      if (!user) return
      const wasFav = favouriteIds.has(nightId)
      setFavouriteIds((prev) => {
        const next = new Set(prev)
        if (wasFav) next.delete(nightId)
        else next.add(nightId)
        return next
      })
      try {
        if (wasFav) await removeFavourite(user.id, nightId)
        else await addFavourite(user.id, nightId)
      } catch {
        // Revert optimistic update on failure
        setFavouriteIds((prev) => {
          const next = new Set(prev)
          if (wasFav) next.add(nightId)
          else next.delete(nightId)
          return next
        })
      }
    },
    [user, favouriteIds],
  )

  const toggleGoing = useCallback(
    async (nightId: string) => {
      if (!user) return
      const wasGoing = userGoingIds.has(nightId)
      setUserGoingIds((prev) => {
        const next = new Set(prev)
        if (wasGoing) next.delete(nightId)
        else next.add(nightId)
        return next
      })
      setGoingCounts((prev) => ({
        ...prev,
        [nightId]: Math.max(0, (prev[nightId] ?? 0) + (wasGoing ? -1 : 1)),
      }))
      try {
        await toggleAttendance(user.id, nightId, wasGoing)
      } catch {
        // Revert both optimistic updates on failure
        setUserGoingIds((prev) => {
          const next = new Set(prev)
          if (wasGoing) next.add(nightId)
          else next.delete(nightId)
          return next
        })
        setGoingCounts((prev) => ({
          ...prev,
          [nightId]: Math.max(0, (prev[nightId] ?? 0) + (wasGoing ? 1 : -1)),
        }))
      }
    },
    [user, userGoingIds],
  )

  return (
    <SocialContext.Provider
      value={{ favouriteIds, userGoingIds, goingCounts, isFavourite, isGoing, toggleFavourite, toggleGoing, isLoading }}
    >
      {children}
    </SocialContext.Provider>
  )
}

export function useSocial(): SocialContextValue {
  const ctx = useContext(SocialContext)
  if (!ctx) throw new Error('useSocial must be used inside SocialProvider')
  return ctx
}
