import type { ComedyNight } from '../types/comedyNight'
import seedNights from '../data/nights'

// Data access layer — currently reads static seed data.
// When Supabase lands, swap this file; components and hooks are unaffected.
export async function getAllNights(): Promise<ComedyNight[]> {
  return Promise.resolve(seedNights)
}
