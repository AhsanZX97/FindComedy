import type {
  NightType,
  Level,
  NightStatus,
  Weekday,
  Schedule,
  VibeTag,
} from '../../src/types/comedyNight'
import { nightSlug } from '../../src/utils/slug'

/**
 * Test-data builders. Each has sensible defaults that produce a valid London
 * night/review/user; scenarios override only the field under test so intent
 * stays obvious. Factories return rows in the *raw Supabase shape* (snake_case)
 * — i.e. exactly what the REST mock serves and the app's mappers consume.
 */

/** Raw `nights` row as returned by `GET /rest/v1/nights` (see services/nightMapper). */
export interface NightRow {
  id: string
  name: string
  description: string
  type: NightType
  levels: Level[]
  bringer: { required: boolean; count?: number; note?: string }
  schedules: Schedule[]
  venue: {
    id: string
    name: string
    address: string
    area: string
    nearestStation?: string
    location: { lat: number; lng: number }
  }
  how_to_book: { contact: string }
  wheelchair_accessible: boolean | null
  socials: Record<string, string | undefined>
  status: NightStatus
  last_verified: string
  images: string[] | null
  owner_id: string | null
}

export interface NightOptions {
  id?: string
  name?: string
  description?: string
  type?: NightType
  levels?: Level[]
  weekday?: Weekday
  startTime?: string
  bringer?: boolean
  bringerCount?: number
  venueName?: string
  address?: string
  area?: string
  status?: NightStatus
  lastVerified?: string
  contact?: string
  ownerId?: string
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

/** ISO date (yyyy-mm-dd) for `n` days before now — for freshness scenarios. */
export function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

export function nightFactory(opts: NightOptions = {}): NightRow {
  const name = opts.name ?? 'The Featured Mic'
  const area = opts.area ?? 'Camden'
  const venueName = opts.venueName ?? 'The Camden Head'
  return {
    id: opts.id ?? nightSlug({ name, venue: { name: venueName, area } }),
    name,
    description: opts.description ?? 'A friendly night of comedy.',
    type: opts.type ?? 'open-mic',
    levels: opts.levels ?? ['new'],
    bringer: { required: opts.bringer ?? false, count: opts.bringerCount },
    schedules: [
      {
        frequency: 'weekly',
        weekday: opts.weekday ?? 1,
        startTime: opts.startTime ?? '20:00',
      } as Schedule,
    ],
    venue: {
      id: slugify(venueName) + '-venue',
      name: venueName,
      address: opts.address ?? '100 Camden High St, London NW1 0LU',
      area,
      location: { lat: 51.539, lng: -0.1426 },
    },
    how_to_book: { contact: opts.contact ?? 'Email the host to book a slot.' },
    wheelchair_accessible: null,
    socials: {},
    status: opts.status ?? 'active',
    last_verified: opts.lastVerified ?? daysAgo(3),
    images: null,
    owner_id: opts.ownerId ?? null,
  }
}

/** Raw `reviews` row as returned by `GET /rest/v1/reviews`. */
export interface ReviewRow {
  id: string
  night_id: string
  user_id: string
  display_name: string
  tags: VibeTag[]
  note: string | null
  created_at: string
}

export interface ReviewOptions {
  id?: string
  nightId: string
  userId?: string
  displayName?: string
  tags?: VibeTag[]
  note?: string
  createdAt?: string
}

let reviewSeq = 0

export function reviewFactory(opts: ReviewOptions): ReviewRow {
  reviewSeq += 1
  return {
    id: opts.id ?? `review-${reviewSeq}`,
    night_id: opts.nightId,
    user_id: opts.userId ?? `user-${reviewSeq}`,
    display_name: opts.displayName ?? 'A punter',
    tags: opts.tags ?? ['friendly-host'],
    note: opts.note ?? null,
    created_at: opts.createdAt ?? new Date().toISOString(),
  }
}

export interface MockUser {
  id: string
  email: string
  isAdmin: boolean
  displayName: string
}

export interface UserOptions {
  id?: string
  email?: string
  isAdmin?: boolean
  displayName?: string
}

let userSeq = 0

export function userFactory(opts: UserOptions = {}): MockUser {
  userSeq += 1
  const email = opts.email ?? `comic${userSeq}@example.com`
  return {
    id: opts.id ?? `user-${slugify(email)}`,
    email,
    isAdmin: opts.isAdmin ?? false,
    displayName: opts.displayName ?? email.split('@')[0],
  }
}
