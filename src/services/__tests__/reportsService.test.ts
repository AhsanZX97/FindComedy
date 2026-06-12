import { describe, it, expect, vi } from 'vitest'

vi.mock('../supabase', () => ({
  supabase: null,
  isSupabaseConfigured: false,
}))

import {
  getReportsForNight,
  submitReport,
  getReportCountsByNight,
  getAllReports,
  resolveReport,
  deleteReportById,
} from '../reportsService'

describe('getReportsForNight', () => {
  it('returns empty array when Supabase is not configured', async () => {
    const reports = await getReportsForNight('night-abc')
    expect(reports).toEqual([])
  })
})

describe('submitReport', () => {
  it('is a no-op when Supabase is not configured', async () => {
    await expect(submitReport('user-1', 'night-abc', 'wrong-time')).resolves.toBeUndefined()
  })
})

describe('getReportCountsByNight', () => {
  it('returns empty record when Supabase is not configured', async () => {
    const counts = await getReportCountsByNight()
    expect(counts).toEqual({})
  })
})

describe('getAllReports', () => {
  it('returns empty array when Supabase is not configured', async () => {
    expect(await getAllReports()).toEqual([])
  })
})

describe('resolveReport', () => {
  it('is a no-op when Supabase is not configured', async () => {
    await expect(resolveReport('report-1')).resolves.toBeUndefined()
  })
})

describe('deleteReportById', () => {
  it('is a no-op when Supabase is not configured', async () => {
    await expect(deleteReportById('report-1')).resolves.toBeUndefined()
  })
})
