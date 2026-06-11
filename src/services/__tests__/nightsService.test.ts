import { describe, it, expect, vi } from 'vitest'

vi.mock('../supabase', () => ({
  supabase: null,
  isSupabaseConfigured: false,
}))

import { getAllNights } from '../nightsService'

describe('getAllNights', () => {
  it('returns seed nights when Supabase is not configured', async () => {
    const nights = await getAllNights()
    expect(nights.length).toBeGreaterThan(0)
    expect(nights[0]).toMatchObject({
      id: expect.any(String),
      name: expect.any(String),
      status: 'active',
    })
  })

  it('returns nights with all required fields', async () => {
    const nights = await getAllNights()
    for (const night of nights) {
      expect(night.id).toBeTruthy()
      expect(night.name).toBeTruthy()
      expect(night.venue).toBeDefined()
      expect(night.schedule).toBeDefined()
      expect(night.bringer).toBeDefined()
    }
  })
})
