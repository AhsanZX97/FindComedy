import { useEffect, useState } from 'react'
import type { ComedyNight } from '../types/comedyNight'
import { getAllNights } from '../services/nightsService'

type NightsState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; data: ComedyNight[] }

export function useNights(): NightsState {
  const [state, setState] = useState<NightsState>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false
    getAllNights()
      .then((data) => {
        if (!cancelled) setState({ status: 'ready', data })
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : 'Failed to load nights'
          setState({ status: 'error', message })
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  return state
}
