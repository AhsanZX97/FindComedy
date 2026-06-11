import { describe, it, expect, vi } from 'vitest'

vi.mock('../supabase', () => ({
  supabase: null,
  isSupabaseConfigured: false,
}))

import { getGoingCounts, getUserGoingNightIds, toggleAttendance } from '../attendanceService'

describe('getGoingCounts', () => {
  it('returns empty record when Supabase is not configured', async () => {
    const counts = await getGoingCounts()
    expect(counts).toEqual({})
  })
})

describe('getUserGoingNightIds', () => {
  it('returns empty array when Supabase is not configured', async () => {
    const ids = await getUserGoingNightIds('user-123')
    expect(ids).toEqual([])
  })
})

describe('toggleAttendance', () => {
  it('is a no-op when Supabase is not configured', async () => {
    await expect(toggleAttendance('user-123', 'night-abc', false)).resolves.toBeUndefined()
  })
})
