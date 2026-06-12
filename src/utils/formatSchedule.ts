import type { ComedyNight } from '../types/comedyNight'

export const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
export const WEEKDAY_LONG_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const FREQ_LABELS: Record<string, string> = {
  weekly: 'Every',
  biweekly: 'Every other',
  monthly: 'Monthly',
  irregular: '',
}

export function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number)
  const suffix = h >= 12 ? 'pm' : 'am'
  const hour = h > 12 ? h - 12 : h === 0 ? 12 : h
  return m === 0 ? `${hour}${suffix}` : `${hour}:${m.toString().padStart(2, '0')}${suffix}`
}

export function formatSchedule(night: ComedyNight): string {
  const freq = FREQ_LABELS[night.schedule.frequency]
  const day = WEEKDAY_LABELS[night.schedule.weekday]
  const time = formatTime(night.schedule.startTime)
  if (night.schedule.frequency === 'irregular') return time
  return `${freq} ${day} · ${time}`.trim()
}
