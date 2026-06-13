import { supabase } from './supabase'
import type { NightSubmission, StoredSubmission, ComedyNight } from '../types/comedyNight'
import { upsertNight } from './nightsService'

export async function submitNight(submission: NightSubmission): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { submitterNote, ...data } = submission
  const payload: Record<string, unknown> = { data }
  if (submitterNote?.trim()) payload.submitter_note = submitterNote.trim()
  const { error } = await supabase.from('submissions').insert(payload)
  if (error) throw new Error(error.message)
}

interface SubmissionRow {
  id: string
  data: NightSubmission
  status: string
  submitter_note: string | null
  created_at: string
}

function rowToSubmission(row: SubmissionRow): StoredSubmission {
  return {
    id: row.id,
    data: row.data,
    status: row.status as StoredSubmission['status'],
    submitterNote: row.submitter_note ?? undefined,
    createdAt: row.created_at,
  }
}

export async function getSubmissionById(id: string): Promise<StoredSubmission | null> {
  if (!supabase) return null
  const { data, error } = await supabase.from('submissions').select('*').eq('id', id).single()
  if (error) throw new Error(error.message)
  if (!data) return null
  return rowToSubmission(data as SubmissionRow)
}

export async function getSubmissions(
  status?: StoredSubmission['status'],
): Promise<StoredSubmission[]> {
  if (!supabase) return []
  let query = supabase.from('submissions').select('*').order('created_at', { ascending: false })
  if (status) query = query.eq('status', status)
  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []).map((r) => rowToSubmission(r as SubmissionRow))
}

export async function setSubmissionStatus(
  id: string,
  status: StoredSubmission['status'],
): Promise<void> {
  if (!supabase) return
  const { error } = await supabase.from('submissions').update({ status }).eq('id', id)
  if (error) throw new Error(error.message)
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

export async function approveSubmission(sub: StoredSubmission): Promise<void> {
  if (!supabase) return
  const form = sub.data

  const night: ComedyNight = {
    id: slugify(form.name) + '-' + sub.id.slice(0, 8),
    name: form.name,
    description: form.description,
    type: form.type,
    levels: form.levels,
    bringer: {
      required: form.bringerRequired,
      count: form.bringerCount,
      note: form.bringerNote,
    },
    schedule: {
      frequency: form.frequency,
      weekday: form.weekday,
      startTime: form.startTime,
      note: form.scheduleNote,
    },
    venue: {
      id: slugify(form.venueName) + '-venue',
      name: form.venueName,
      address: form.venueAddress,
      area: '',
      location: { lat: 0, lng: 0 },
    },
    howToBook: {
      contact: form.contact ?? '',
    },
    wheelchairAccessible: null,
    socials: {
      website: form.website,
      instagram: form.instagram,
      facebook: form.facebook,
    },
    status: 'active',
    lastVerified: new Date().toISOString().slice(0, 10),
  }

  await upsertNight(night)
  await setSubmissionStatus(sub.id, 'approved')
}
