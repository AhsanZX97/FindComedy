import type { ComedyNight } from '../types/comedyNight'
import { normalizeSchedules } from '../utils/normalizeSchedules'

/** Map a raw Supabase `nights` row (snake_case) to a ComedyNight. Pure — no client deps. */
export function rowToNight(row: Record<string, unknown>): ComedyNight {
  return {
    id: row.id as string,
    name: row.name as string,
    description: row.description as string,
    type: row.type as ComedyNight['type'],
    levels: row.levels as ComedyNight['levels'],
    bringer: row.bringer as ComedyNight['bringer'],
    schedules: normalizeSchedules(row.schedules ?? row.schedule),
    venue: row.venue as ComedyNight['venue'],
    howToBook: row.how_to_book as ComedyNight['howToBook'],
    wheelchairAccessible: row.wheelchair_accessible as boolean | null,
    socials: row.socials as ComedyNight['socials'],
    status: row.status as ComedyNight['status'],
    lastVerified: row.last_verified as string,
    images: row.images as string[] | undefined,
  }
}

/** Map a ComedyNight to a Supabase `nights` row for upsert. */
export function nightToRow(night: ComedyNight): Record<string, unknown> {
  return {
    id: night.id,
    name: night.name,
    description: night.description,
    type: night.type,
    levels: night.levels,
    bringer: night.bringer,
    schedule: night.schedules,
    venue: night.venue,
    how_to_book: night.howToBook,
    wheelchair_accessible: night.wheelchairAccessible,
    socials: night.socials,
    status: night.status,
    last_verified: night.lastVerified,
    images: night.images ?? null,
    updated_at: new Date().toISOString(),
  }
}
