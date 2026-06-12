import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { useAuth } from '../auth/AuthContext'
import { getFavouriteNightIds, addFavourite, removeFavourite } from '../../services/favouritesService'

export interface SocialContextValue {
  favouriteIds: Set<string>
  isFavourite: (nightId: string) => boolean
  toggleFavourite: (nightId: string) => Promise<void>
  isLoading: boolean
}

const SocialContext = createContext<SocialContextValue | null>(null)

export function SocialProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [favouriteIds, setFavouriteIds] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(false)

  // User-specific data resets on sign-out, loads on sign-in
  useEffect(() => {
    if (!user) {
      setFavouriteIds(new Set())
      return
    }
    setIsLoading(true)
    getFavouriteNightIds(user.id)
      .then((favIds) => setFavouriteIds(new Set(favIds)))
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [user?.id])

  const isFavourite = useCallback((nightId: string) => favouriteIds.has(nightId), [favouriteIds])

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

  return (
    <SocialContext.Provider
      value={{ favouriteIds, isFavourite, toggleFavourite, isLoading }}
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
