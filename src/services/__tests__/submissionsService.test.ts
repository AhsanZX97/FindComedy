import { describe, it, expect, vi } from 'vitest'

vi.mock('../supabase', () => ({
  supabase: null,
  isSupabaseConfigured: false,
}))

import { submitNight } from '../submissionsService'
import type { NightSubmission } from '../../types/comedyNight'

const validSubmission: NightSubmission = {
  name: 'Test Comedy Night',
  description: 'A test night',
  type: 'open-mic',
  levels: ['new'],
  bringerRequired: false,
  frequency: 'weekly',
  weekday: 2,
  startTime: '20:00',
  venueName: 'The Test Pub',
  venueAddress: '1 Test St, London',
  venueArea: 'Hackney',
  entry: 'Free',
}

describe('submitNight', () => {
  it('throws when Supabase is not configured', async () => {
    await expect(submitNight(validSubmission)).rejects.toThrow('Supabase is not configured')
  })
})
