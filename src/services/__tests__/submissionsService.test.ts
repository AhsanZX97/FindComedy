import { describe, it, expect, vi } from 'vitest'

vi.mock('../supabase', () => ({
  supabase: null,
  isSupabaseConfigured: false,
}))

import { submitNight, getSubmissions, setSubmissionStatus, approveSubmission, publishSubmission } from '../submissionsService'
import type { NightSubmission, StoredSubmission } from '../../types/comedyNight'

const validSubmission: NightSubmission = {
  name: 'Test Comedy Night',
  description: 'A test night',
  type: 'open-mic',
  levels: ['new'],
  bringerRequired: false,
  schedules: [{ frequency: 'weekly', weekday: 2, startTime: '20:00' }],
  venueName: 'The Test Pub',
  venueAddress: '1 Test St, London',
}

const validStoredSubmission: StoredSubmission = {
  id: 'sub-uuid-1234',
  data: validSubmission,
  status: 'pending',
  createdAt: '2025-01-01T00:00:00Z',
}

describe('submitNight', () => {
  it('throws when Supabase is not configured', async () => {
    await expect(submitNight(validSubmission)).rejects.toThrow('Supabase is not configured')
  })
})

describe('getSubmissions', () => {
  it('returns empty array when Supabase is not configured', async () => {
    expect(await getSubmissions()).toEqual([])
    expect(await getSubmissions('pending')).toEqual([])
  })
})

describe('setSubmissionStatus', () => {
  it('is a no-op when Supabase is not configured', async () => {
    await expect(setSubmissionStatus('sub-1', 'approved')).resolves.toBeUndefined()
  })
})

describe('approveSubmission', () => {
  it('is a no-op when Supabase is not configured', async () => {
    await expect(approveSubmission(validStoredSubmission)).resolves.toBeUndefined()
  })
})

describe('publishSubmission', () => {
  it('is a no-op when Supabase is not configured', async () => {
    await expect(publishSubmission(validSubmission)).resolves.toBeUndefined()
    await expect(publishSubmission(validSubmission, { lat: 51.5, lng: -0.1 })).resolves.toBeUndefined()
  })
})
