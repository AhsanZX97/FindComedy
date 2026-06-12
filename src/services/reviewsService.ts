import { supabase } from './supabase'
import type { Review, VibeTag } from '../types/comedyNight'

interface ReviewRow {
  id: string
  night_id: string
  user_id: string
  display_name: string
  tags: string[]
  note: string | null
  created_at: string
}

function rowToReview(row: ReviewRow): Review {
  return {
    id: row.id,
    nightId: row.night_id,
    userId: row.user_id,
    displayName: row.display_name,
    tags: row.tags as VibeTag[],
    note: row.note ?? undefined,
    createdAt: row.created_at,
  }
}

export async function getReviewsForNight(nightId: string): Promise<Review[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('night_id', nightId)
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []).map((r) => rowToReview(r as ReviewRow))
}

export async function getUserReviewForNight(
  userId: string,
  nightId: string,
): Promise<Review | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('user_id', userId)
    .eq('night_id', nightId)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data ? rowToReview(data as ReviewRow) : null
}

export async function upsertReview(
  userId: string,
  nightId: string,
  displayName: string,
  tags: VibeTag[],
  note?: string,
): Promise<void> {
  if (!supabase) return
  const payload: Record<string, unknown> = {
    user_id: userId,
    night_id: nightId,
    display_name: displayName,
    tags,
  }
  if (note?.trim()) payload.note = note.trim()
  const { error } = await supabase
    .from('reviews')
    .upsert(payload, { onConflict: 'user_id,night_id' })
  if (error) throw new Error(error.message)
}

export async function deleteReview(userId: string, nightId: string): Promise<void> {
  if (!supabase) return
  const { error } = await supabase
    .from('reviews')
    .delete()
    .eq('user_id', userId)
    .eq('night_id', nightId)
  if (error) throw new Error(error.message)
}

export async function deleteReviewById(id: string): Promise<void> {
  if (!supabase) return
  const { error } = await supabase.from('reviews').delete().eq('id', id)
  if (error) throw new Error(error.message)
}
