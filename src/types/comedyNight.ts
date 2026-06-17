export type NightType = 'open-mic' | 'showcase' | 'pro' | 'mixed'
export type Level = 'new' | 'experienced' | 'pro'
export type NightStatus = 'active' | 'paused' | 'gone'
// 0=Sunday, 1=Monday, ... 6=Saturday
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6
export type Frequency = 'weekly' | 'biweekly' | 'monthly' | 'irregular'

export interface BringerPolicy {
  required: boolean
  count?: number
  note?: string
}

export interface Schedule {
  frequency: Frequency
  weekday: Weekday
  startTime: string // 'HH:MM' 24-hour
  note?: string
}

export interface Venue {
  id: string
  name: string
  address: string
  area: string
  nearestStation?: string
  location: { lat: number; lng: number }
}

export interface SocialLinks {
  website?: string
  instagram?: string
  facebook?: string
  facebookGroup?: string
  tiktok?: string
  youtube?: string
}

export interface ComedyNight {
  id: string
  name: string
  description: string
  type: NightType
  levels: Level[]
  bringer: BringerPolicy
  schedules: Schedule[]
  venue: Venue
  howToBook: { contact: string }
  wheelchairAccessible: boolean | null
  socials: SocialLinks
  status: NightStatus
  lastVerified: string // ISO date string
  images?: string[]
}

export type ReportType =
  | 'no-longer-running'
  | 'wrong-time'
  | 'wrong-venue'
  | 'wrong-info'
  | 'other'

export const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  'no-longer-running': 'Night is no longer running',
  'wrong-time': 'Wrong time or day',
  'wrong-venue': 'Wrong venue or address',
  'wrong-info': 'Other info is wrong',
  'other': 'Something else',
}

export interface Report {
  id: string
  nightId: string
  userId: string
  type: ReportType
  note?: string
  resolvedAt?: string
  createdAt: string
}

export type VibeTag =
  | 'rowdy-crowd'
  | 'chill-vibe'
  | 'good-for-first-timers'
  | 'friendly-host'
  | 'strong-lineup'
  | 'noisy-pub'
  | 'intimate'
  | 'long-sets'

export const VIBE_TAG_LABELS: Record<VibeTag, string> = {
  'rowdy-crowd': 'Rowdy crowd',
  'chill-vibe': 'Chill vibe',
  'good-for-first-timers': 'Good for first-timers',
  'friendly-host': 'Friendly host',
  'strong-lineup': 'Strong lineup',
  'noisy-pub': 'Noisy pub',
  'intimate': 'Intimate',
  'long-sets': 'Long sets',
}

export const ALL_VIBE_TAGS: VibeTag[] = [
  'rowdy-crowd',
  'chill-vibe',
  'good-for-first-timers',
  'friendly-host',
  'strong-lineup',
  'noisy-pub',
  'intimate',
  'long-sets',
]

export interface Review {
  id: string
  nightId: string
  userId: string
  displayName?: string
  tags: VibeTag[]
  note?: string
  createdAt: string
}

export interface NightSubmission {
  name: string
  description: string
  type: NightType
  levels: Level[]
  bringerRequired: boolean
  bringerCount?: number
  bringerNote?: string
  schedules: Schedule[]
  venueName: string
  venueAddress: string
  contact?: string
  website?: string
  instagram?: string
  facebook?: string
  submitterNote?: string
}

export interface StoredSubmission {
  id: string
  data: NightSubmission
  status: 'pending' | 'approved' | 'rejected'
  submitterNote?: string
  createdAt: string
}

export interface NightFilters {
  search: string
  weekdays: Weekday[]
  type: NightType | null
  level: Level | null
  noBringer: boolean
}

export const DEFAULT_FILTERS: NightFilters = {
  search: '',
  weekdays: [],
  type: null,
  level: null,
  noBringer: false,
}

export interface SiteFeedback {
  id: string
  message: string
  email?: string
  createdAt: string
}
