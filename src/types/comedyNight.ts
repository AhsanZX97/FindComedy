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
  schedule: Schedule
  venue: Venue
  pricing: { entry: string; performerPay?: string }
  howToBook: { audience?: string; performers?: string }
  socials: SocialLinks
  status: NightStatus
  lastVerified: string // ISO date string
  images?: string[]
}

export interface NightFilters {
  search: string
  weekday: Weekday | null
  area: string | null
  type: NightType | null
  level: Level | null
  noBringer: boolean
  freeEntry: boolean
}

export const DEFAULT_FILTERS: NightFilters = {
  search: '',
  weekday: null,
  area: null,
  type: null,
  level: null,
  noBringer: false,
  freeEntry: false,
}
