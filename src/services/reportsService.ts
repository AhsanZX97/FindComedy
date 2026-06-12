import { supabase } from './supabase'
import type { Report, ReportType } from '../types/comedyNight'

interface ReportRow {
  id: string
  night_id: string
  user_id: string
  type: string
  note: string | null
  created_at: string
}

function rowToReport(row: ReportRow): Report {
  return {
    id: row.id,
    nightId: row.night_id,
    userId: row.user_id,
    type: row.type as ReportType,
    note: row.note ?? undefined,
    createdAt: row.created_at,
  }
}

export async function getReportsForNight(nightId: string): Promise<Report[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .eq('night_id', nightId)
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []).map((r) => rowToReport(r as ReportRow))
}

export async function submitReport(
  userId: string,
  nightId: string,
  type: ReportType,
  note?: string,
): Promise<void> {
  if (!supabase) return
  const payload: Record<string, unknown> = { user_id: userId, night_id: nightId, type }
  if (note?.trim()) payload.note = note.trim()
  const { error } = await supabase.from('reports').insert(payload)
  if (error) throw new Error(error.message)
}

export async function getReportCountsByNight(): Promise<Record<string, number>> {
  if (!supabase) return {}
  const { data, error } = await supabase.from('reports').select('night_id')
  if (error) throw new Error(error.message)
  const counts: Record<string, number> = {}
  for (const row of data ?? []) {
    const nightId = (row as Record<string, unknown>).night_id as string
    counts[nightId] = (counts[nightId] ?? 0) + 1
  }
  return counts
}
