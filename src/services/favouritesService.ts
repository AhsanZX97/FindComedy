import { supabase } from './supabase'

export async function getFavouriteNightIds(userId: string): Promise<string[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('favourites')
    .select('night_id')
    .eq('user_id', userId)
  if (error) throw new Error(error.message)
  return (data ?? []).map((row) => (row as Record<string, unknown>).night_id as string)
}

export async function addFavourite(userId: string, nightId: string): Promise<void> {
  if (!supabase) return
  const { error } = await supabase.from('favourites').insert({ user_id: userId, night_id: nightId })
  if (error) throw new Error(error.message)
}

export async function removeFavourite(userId: string, nightId: string): Promise<void> {
  if (!supabase) return
  const { error } = await supabase
    .from('favourites')
    .delete()
    .eq('user_id', userId)
    .eq('night_id', nightId)
  if (error) throw new Error(error.message)
}
