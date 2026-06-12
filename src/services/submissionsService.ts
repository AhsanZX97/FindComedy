import { supabase } from './supabase'
import type { NightSubmission } from '../types/comedyNight'

export async function submitNight(submission: NightSubmission): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { submitterNote, ...data } = submission
  const payload: Record<string, unknown> = { data }
  if (submitterNote?.trim()) payload.submitter_note = submitterNote.trim()
  const { error } = await supabase.from('submissions').insert(payload)
  if (error) throw new Error(error.message)
}
