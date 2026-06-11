import type { Profile, UserRole } from '../types/auth'
import { supabase } from './supabase'

function rowToProfile(row: Record<string, unknown>): Profile {
  return {
    id: row.id as string,
    displayName: row.display_name as string,
    avatarUrl: (row.avatar_url as string | null) ?? null,
    role: row.role as UserRole,
    createdAt: row.created_at as string,
  }
}

export async function getProfile(userId: string): Promise<Profile | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  if (error || !data) return null
  return rowToProfile(data as Record<string, unknown>)
}

export async function updateProfile(
  userId: string,
  updates: Partial<Pick<Profile, 'displayName' | 'role'>>,
): Promise<void> {
  if (!supabase) return
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (updates.displayName !== undefined) patch.display_name = updates.displayName
  if (updates.role !== undefined) patch.role = updates.role
  const { error } = await supabase.from('profiles').update(patch).eq('id', userId)
  if (error) throw new Error(error.message)
}
