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

function nightToRow(night: ComedyNight): Record<string, unknown> {
  return {
    id: night.id,
    name: night.name,
    description: night.description,
    type: night.type,
    levels: night.levels,
    bringer: night.bringer,
    schedule: night.schedule,
    venue: night.venue,
    pricing: night.pricing,
    how_to_book: night.howToBook,
    socials: night.socials,
    status: night.status,
    last_verified: night.lastVerified,
    images: night.images ?? null,
    updated_at: new Date().toISOString(),
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

export async function getNightById(id: string): Promise<ComedyNight | null> {
  if (!isSupabaseConfigured || !supabase) {
    const night = seedNights.find((n) => n.id === id) ?? null
    return Promise.resolve(night)
  }
  const { data, error } = await supabase.from('nights').select('*').eq('id', id).maybeSingle()
  if (error) throw new Error(error.message)
  return data ? rowToNight(data as Record<string, unknown>) : null
}

export async function upsertNight(night: ComedyNight): Promise<void> {
  if (!supabase) return
  const row = nightToRow(night)
  const { error } = await supabase.from('nights').upsert(row, { onConflict: 'id' })
  if (error) throw new Error(error.message)
}

export async function deleteNight(id: string): Promise<void> {
  if (!supabase) return
  const { error } = await supabase.from('nights').delete().eq('id', id)
  if (error) throw new Error(error.message)
}
