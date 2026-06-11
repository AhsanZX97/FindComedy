import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const isSupabaseConfigured = Boolean(url && anonKey)

// supabase is null when env vars are not set (static/dev mode falls back to seed data).
// The anon key is intentionally public — security lives in RLS policies.
export const supabase = url && anonKey
  ? createClient(url, anonKey, { auth: { flowType: 'pkce' } })
  : null
