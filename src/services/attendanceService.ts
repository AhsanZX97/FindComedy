import { supabase } from './supabase'

export async function getGoingCounts(): Promise<Record<string, number>> {
  if (!supabase) return {}
  const { data, error } = await supabase.from('attendance').select('night_id')
  if (error) throw new Error(error.message)
  const counts: Record<string, number> = {}
  for (const row of data ?? []) {
    const nightId = (row as Record<string, unknown>).night_id as string
    counts[nightId] = (counts[nightId] ?? 0) + 1
  }
  return counts
}

export async function getUserGoingNightIds(userId: string): Promise<string[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('attendance')
    .select('night_id')
    .eq('user_id', userId)
  if (error) throw new Error(error.message)
  return (data ?? []).map((row) => (row as Record<string, unknown>).night_id as string)
}

export async function toggleAttendance(
  userId: string,
  nightId: string,
  currentlyGoing: boolean,
): Promise<void> {
  if (!supabase) return
  if (currentlyGoing) {
    const { error } = await supabase
      .from('attendance')
      .delete()
      .eq('user_id', userId)
      .eq('night_id', nightId)
    if (error) throw new Error(error.message)
  } else {
    const { error } = await supabase
      .from('attendance')
      .insert({ user_id: userId, night_id: nightId })
    if (error) throw new Error(error.message)
  }
}
