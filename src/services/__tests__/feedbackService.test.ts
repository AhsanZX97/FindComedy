import { describe, it, expect, vi } from 'vitest'

vi.mock('../supabase', () => ({
  supabase: null,
  isSupabaseConfigured: false,
}))

import { getAllFeedback, deleteFeedbackById, submitFeedback } from '../feedbackService'

describe('getAllFeedback', () => {
  it('returns empty array when Supabase is not configured', async () => {
    expect(await getAllFeedback()).toEqual([])
  })
})

describe('deleteFeedbackById', () => {
  it('is a no-op when Supabase is not configured', async () => {
    await expect(deleteFeedbackById('some-id')).resolves.toBeUndefined()
  })
})

describe('submitFeedback', () => {
  it('throws when Supabase is not configured', async () => {
    await expect(submitFeedback('hello')).rejects.toThrow('Supabase is not configured')
  })
})
