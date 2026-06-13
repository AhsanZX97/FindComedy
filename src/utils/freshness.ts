export type FreshnessStatus = 'fresh' | 'stale' | 'unknown'

function daysBetween(isoDate: string, now: Date): number {
  const verified = new Date(isoDate)
  const ms = now.getTime() - verified.getTime()
  return Math.floor(ms / (1000 * 60 * 60 * 24))
}

export function getFreshnessLabel(lastVerified: string, now: Date = new Date()): string {
  const days = daysBetween(lastVerified, now)

  if (days === 0) return 'Updated today'
  if (days === 1) return 'Updated yesterday'
  if (days < 7) return `Updated ${days} days ago`

  const weeks = Math.floor(days / 7)
  if (weeks < 4) return weeks === 1 ? 'Updated 1 week ago' : `Updated ${weeks} weeks ago`

  const months = Math.round(days / 30)
  return months === 1 ? 'Updated 1 month ago' : `Updated ${months} months ago`
}

export function getFreshnessStatus(lastVerified: string, now: Date = new Date()): FreshnessStatus {
  const days = daysBetween(lastVerified, now)
  if (days < 28) return 'fresh'
  if (days < 56) return 'stale'
  return 'unknown'
}
