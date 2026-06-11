import type { ComedyNight } from '../types/comedyNight'
import { supabase, isSupabaseConfigured } from './supabase'
import seedNights from '../data/nights'

function rowToNight(row: Record<string, unknown>): ComedyNight {
  return {
    id: row.id as string,
    name: row.name as string,
    description: row.description as string,
    type: row.type as ComedyNight['type'],
    levels: row.levels as ComedyNight['levels'],
    bringer: row.bringer as ComedyNight['bringer'],
    schedule: row.schedule as ComedyNight['schedule'],
    venue: row.venue as ComedyNight['venue'],
    pricing: row.pricing as ComedyNight['pricing'],
    howToBook: row.how_to_book as ComedyNight['howToBook'],
    socials: row.socials as ComedyNight['socials'],
    status: row.status as ComedyNight['status'],
    lastVerified: row.last_verified as string,
    images: row.images as string[] | undefined,
  }
}

// Falls back to static seed data when Supabase is not configured (dev without .env).
export async function getAllNights(): Promise<ComedyNight[]> {
  if (!isSupabaseConfigured || !supabase) {
    return Promise.resolve(seedNights)
  }
  const { data, error } = await supabase.from('nights').select('*')
  if (error) throw new Error(error.message)
  return (data ?? []).map((row) => rowToNight(row as Record<string, unknown>))
}
