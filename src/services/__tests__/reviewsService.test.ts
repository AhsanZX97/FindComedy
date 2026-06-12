import { describe, it, expect, vi } from 'vitest'

vi.mock('../supabase', () => ({
  supabase: null,
  isSupabaseConfigured: false,
}))

import {
  getReviewsForNight,
  getUserReviewForNight,
  upsertReview,
  deleteReview,
} from '../reviewsService'

describe('getReviewsForNight', () => {
  it('returns empty array when Supabase is not configured', async () => {
    const reviews = await getReviewsForNight('night-abc')
    expect(reviews).toEqual([])
  })
})

describe('getUserReviewForNight', () => {
  it('returns null when Supabase is not configured', async () => {
    const review = await getUserReviewForNight('user-1', 'night-abc')
    expect(review).toBeNull()
  })
})

describe('upsertReview', () => {
  it('is a no-op when Supabase is not configured', async () => {
    await expect(
      upsertReview('user-1', 'night-abc', 'Alice', ['chill-vibe']),
    ).resolves.toBeUndefined()
  })
})

describe('deleteReview', () => {
  it('is a no-op when Supabase is not configured', async () => {
    await expect(deleteReview('user-1', 'night-abc')).resolves.toBeUndefined()
  })
})
