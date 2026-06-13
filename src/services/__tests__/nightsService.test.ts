import { describe, it, expect, vi } from 'vitest'

vi.mock('../supabase', () => ({
  supabase: null,
  isSupabaseConfigured: false,
}))

import { getAllNights, getNightById, upsertNight, deleteNight } from '../nightsService'
import type { ComedyNight } from '../../types/comedyNight'

const SAMPLE_NIGHT: ComedyNight = {
  id: 'test-night',
  name: 'Test Night',
  description: 'A test night',
  type: 'open-mic',
  levels: ['new'],
  bringer: { required: false },
  schedules: [{ frequency: 'weekly', weekday: 1, startTime: '20:00' }],
  venue: {
    id: 'venue-1',
    name: 'The Pub',
    address: '1 Test St',
    area: 'Camden',
    location: { lat: 51.5, lng: -0.1 },
  },
  howToBook: { contact: '' },
  wheelchairAccessible: null,
  socials: {},
  status: 'active',
  lastVerified: '2025-01-01',
}

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
      expect(night.schedules).toBeDefined()
      expect(night.bringer).toBeDefined()
    }
  })
})

describe('getNightById', () => {
  it('returns a seed night by id when Supabase is not configured', async () => {
    const nights = await getAllNights()
    const first = nights[0]
    const found = await getNightById(first.id)
    expect(found).not.toBeNull()
    expect(found?.id).toBe(first.id)
  })

  it('returns null for an unknown id when Supabase is not configured', async () => {
    expect(await getNightById('does-not-exist')).toBeNull()
  })
})

describe('upsertNight', () => {
  it('is a no-op when Supabase is not configured', async () => {
    await expect(upsertNight(SAMPLE_NIGHT)).resolves.toBeUndefined()
  })
})

describe('deleteNight', () => {
  it('is a no-op when Supabase is not configured', async () => {
    await expect(deleteNight('test-night')).resolves.toBeUndefined()
  })
})
