import { describe, it, expect, vi } from 'vitest'

vi.mock('../supabase', () => ({
  supabase: null,
  isSupabaseConfigured: false,
}))

import { getIsAdmin } from '../profilesService'

describe('getIsAdmin', () => {
  it('returns false when Supabase is not configured', async () => {
    expect(await getIsAdmin('user-1')).toBe(false)
  })
})
