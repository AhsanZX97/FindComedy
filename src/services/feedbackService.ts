import { supabase } from './supabase'
import type { SiteFeedback } from '../types/comedyNight'

interface FeedbackRow {
  id: string
  message: string
  email: string | null
  created_at: string
}

function rowToFeedback(row: FeedbackRow): SiteFeedback {
  return {
    id: row.id,
    message: row.message,
    email: row.email ?? undefined,
    createdAt: row.created_at,
  }
}

export async function submitFeedback(message: string, email?: string): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured')
  const payload: Record<string, unknown> = { message: message.trim() }
  if (email?.trim()) payload.email = email.trim()
  const { error } = await supabase.from('site_feedback').insert(payload)
  if (error) throw new Error(error.message)
}

export async function getAllFeedback(): Promise<SiteFeedback[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('site_feedback')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []).map((r) => rowToFeedback(r as FeedbackRow))
}

export async function deleteFeedbackById(id: string): Promise<void> {
  if (!supabase) return
  const { error } = await supabase.from('site_feedback').delete().eq('id', id)
  if (error) throw new Error(error.message)
}
