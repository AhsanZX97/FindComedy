import type { ComedyNight, Schedule } from '../types/comedyNight'

export const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
export const WEEKDAY_LONG_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const FREQ_LABELS: Record<string, string> = {
  weekly: 'Every',
  biweekly: 'Every other',
  monthly: 'Monthly',
  irregular: '',
}

export function formatTime(time: string): string {
  if (!time) return ''
  // If already in 12h format (e.g. '7pm', '8:30pm' from Supabase CSV data), pass through as-is.
  if (/am|pm/i.test(time)) return time.toLowerCase()
  const [hStr, mStr] = time.split(':')
  const h = Number(hStr)
  if (isNaN(h)) return time
  const m = Number(mStr ?? '0')
  const suffix = h >= 12 ? 'pm' : 'am'
  const hour = h > 12 ? h - 12 : h === 0 ? 12 : h
  return m === 0 ? `${hour}${suffix}` : `${hour}:${m.toString().padStart(2, '0')}${suffix}`
}

export function formatScheduleEntry(s: Schedule): string {
  const time = formatTime(s.startTime)
  if (s.frequency === 'irregular') return time
  const freq = FREQ_LABELS[s.frequency]
  const day = WEEKDAY_LABELS[s.weekday]
  return `${freq} ${day} · ${time}`.trim()
}

export function formatSchedule(night: ComedyNight): string {
  if (!night.schedules || night.schedules.length === 0) return ''
  const entries = night.schedules.map(formatScheduleEntry)
  if (entries.length <= 2) return entries.join(' · ')
  return entries.slice(0, 2).join(' · ') + ` +${entries.length - 2} more`
}
