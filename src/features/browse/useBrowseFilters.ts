import { useState } from 'react'
import { DEFAULT_FILTERS } from '../../types/comedyNight'
import type { NightFilters } from '../../types/comedyNight'

const SESSION_KEY = 'browse-filters'

function readSession(): NightFilters {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (!raw) return DEFAULT_FILTERS
    return { ...DEFAULT_FILTERS, ...JSON.parse(raw) }
  } catch {
    return DEFAULT_FILTERS
  }
}

export function useBrowseFilters() {
  const [filters, setFiltersState] = useState<NightFilters>(readSession)

  function setFilters(next: NightFilters) {
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(next))
    } catch {
      // sessionStorage unavailable (private browsing quota etc.) — just skip
    }
    setFiltersState(next)
  }

  return [filters, setFilters] as const
}
