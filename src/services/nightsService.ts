import type { ComedyNight } from '../types/comedyNight'
import { supabase, isSupabaseConfigured } from './supabase'
import { rowToNight, nightToRow } from './nightMapper'
import seedNights from '../data/nights'

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
