// Reads docs/stand up data.csv and writes supabase/seed_from_csv.sql.
// Run with: npx tsx scripts/importNights.ts
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

// ── Types ─────────────────────────────────────────────────────────────────────

type NightType = 'open-mic' | 'showcase' | 'mixed'
type Level = 'new' | 'experienced' | 'pro'
type Frequency = 'weekly' | 'biweekly' | 'monthly' | 'irregular'
type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6

interface ImportRow {
  Name: string
  'Event Category': string
  'Comedian Level': string
  'Event Description': string
  Frequency: string
  'Weekday / Month': string
  'Event Time': string
  Bringer: string
  'Wheelchair Access': string
  'Contact / Book a Spot': string
  Venue: string
  Address: string
  Website: string
  'Facebook Page': string
  'Facebook Group': string
  Instagram: string
  Twitter: string
  'Last Update': string
  'Lattitude, Longitude': string
  Latitude: string
  Longitude: string
}

// ── CSV parser ────────────────────────────────────────────────────────────────
// Character-by-character parser that correctly handles quoted multi-line fields.

function parseCsv(text: string): ImportRow[] {
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const headers: string[] = []
  const rows: ImportRow[] = []
  let fields: string[] = []
  let current = ''
  let inQuotes = false
  let isFirstRow = true

  for (let i = 0; i <= normalized.length; i++) {
    const ch = i < normalized.length ? normalized[i] : '\n'
    if (ch === '"') {
      if (inQuotes && normalized[i + 1] === '"') { current += '"'; i++ }
      else inQuotes = !inQuotes
    } else if (ch === ',' && !inQuotes) {
      fields.push(current); current = ''
    } else if (ch === '\n' && !inQuotes) {
      fields.push(current); current = ''
      if (isFirstRow) {
        headers.push(...fields)
        isFirstRow = false
      } else if (fields.some((f) => f.trim())) {
        const obj: Record<string, string> = {}
        headers.forEach((h, idx) => { obj[h] = fields[idx] ?? '' })
        rows.push(obj as unknown as ImportRow)
      }
      fields = []
    } else {
      current += ch
    }
  }
  return rows
}

// ── Field mappers ─────────────────────────────────────────────────────────────

function mapType(category: string): NightType | null {
  const lower = category.toLowerCase()
  const hasOpenMic = lower.includes('open mic')
  const hasShow = lower.includes('show')
  const hasFestival = lower.includes('festival')
  const hasCourse = lower.includes('course')
  const hasWorkshop = lower.includes('workshop')
  if (hasFestival || (hasCourse && !hasShow && !hasOpenMic) || (hasWorkshop && !hasShow && !hasOpenMic)) return null
  if (hasOpenMic && hasShow) return 'mixed'
  if (hasOpenMic) return 'open-mic'
  if (hasShow) return 'showcase'
  return 'mixed'
}

function mapLevels(levelStr: string): Level[] {
  if (!levelStr || levelStr.toLowerCase() === 'unspecified') return []
  return levelStr
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter((s): s is Level => ['new', 'experienced', 'pro'].includes(s))
}

function mapFrequency(freq: string): Frequency {
  const lower = freq.toLowerCase().trim()
  if (lower === 'weekly' || lower === 'daily') return 'weekly'
  if (lower === 'fortnightly') return 'biweekly'
  if (lower === 'monthly') return 'monthly'
  return 'irregular'
}

const WEEKDAY_MAP: Record<string, Weekday> = {
  sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6,
}

function mapWeekdays(dayStr: string): Weekday[] {
  if (!dayStr || dayStr.toLowerCase() === 'unspecified') return []
  return dayStr
    .split(',')
    .map((s) => WEEKDAY_MAP[s.trim().toLowerCase()])
    .filter((w): w is Weekday => w !== undefined)
}

function mapBringer(bringer: string): { required: boolean; note?: string } {
  const lower = bringer.trim().toLowerCase()
  if (lower === 'no' || lower === 'tbc' || lower === '') return { required: false }
  if (lower === 'yes') return { required: true }
  if (lower.includes('yes') && lower.includes('longer spots')) return { required: true, note: 'Not required for longer spots' }
  return { required: true, note: bringer }
}

function mapWheelchair(val: string): boolean | null {
  const lower = val.trim().toLowerCase()
  if (lower === 'yes') return true
  if (lower === 'no' || lower === 'stairs') return false
  if (lower.startsWith('no ')) return false
  return null
}

function mapInstagram(handle: string): string {
  if (!handle || handle.toLowerCase() === 'tbc') return ''
  if (handle.startsWith('http')) return handle
  const clean = handle.replace(/^@/, '')
  return `https://instagram.com/${clean}`
}

function cleanSocial(val: string): string {
  if (!val || val.toLowerCase() === 'tbc' || val.toLowerCase() === 'n/a') return ''
  return val
}

function parseDate(val: string): string {
  if (!val || val.toLowerCase() === 'tbc') return ''
  const parts = val.split('/')
  if (parts.length !== 3) return ''
  const [day, month, year] = parts
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

function isLondonCoord(lat: number, lng: number): boolean {
  return lat > 51.28 && lat < 51.7 && lng > -0.51 && lng < 0.33
}

function addressMentionsLondon(address: string): boolean {
  return /\bLondon\b/i.test(address)
}

// ── SQL helpers ───────────────────────────────────────────────────────────────

const quote = (v: string): string => `'${v.replace(/'/g, "''")}'`
const jsonb = (v: unknown): string => `${quote(JSON.stringify(v))}::jsonb`
const textArray = (vals: string[]): string =>
  vals.length === 0 ? "ARRAY[]::text[]" : `ARRAY[${vals.map(quote).join(', ')}]`
const nullable = (v: boolean | null): string => v === null ? 'NULL' : v ? 'TRUE' : 'FALSE'

// ── Main ──────────────────────────────────────────────────────────────────────

const csvPath = join(process.cwd(), 'docs', 'Stand Up Data.csv')
const outPath = join(process.cwd(), 'supabase', 'seed_from_csv.sql')

const raw = readFileSync(csvPath, 'utf-8')
const rows = parseCsv(raw)

const lines: string[] = [
  '-- Generated by scripts/importNights.ts — do not edit by hand.',
  `-- Source: ${rows.length} CSV rows, ${new Date().toISOString().slice(0, 10)}`,
  '',
  '-- Clear existing nights before importing (favourites/attendance cascade on delete).',
  'DELETE FROM public.nights;',
  '',
  'INSERT INTO public.nights',
  '  (id, name, description, type, levels, bringer, schedule, venue,',
  '   how_to_book, wheelchair_accessible, socials, status, last_verified)',
  'VALUES',
]

const inserts: string[] = []
let skipped = 0

for (const row of rows) {
  const type = mapType(row['Event Category'])
  if (!type) { skipped++; continue }

  const name = row.Name.trim()
  if (!name) { skipped++; continue }

  const venueName = row.Venue.trim()
  const id = slugify(name) + (venueName ? '-' + slugify(venueName) : '')

  const levels = mapLevels(row['Comedian Level'])
  const bringer = mapBringer(row.Bringer)
  const frequency = mapFrequency(row.Frequency)
  const weekdays = mapWeekdays(row['Weekday / Month'])
  const rawTime = (row['Event Time'] ?? '').trim()
  const startTime = rawTime && rawTime.toLowerCase() !== 'tbc' ? rawTime : '20:00'

  // One schedule entry per listed day. When no day is given, the night runs on
  // an irregular basis — store a single irregular entry so it isn't dropped on read.
  const schedules: Record<string, unknown>[] =
    weekdays.length > 0
      ? weekdays.map((weekday) => ({ frequency, weekday, startTime }))
      : [{ frequency: 'irregular', startTime }]

  const lat = parseFloat(row.Latitude)
  const lng = parseFloat(row.Longitude)
  const validCoords = !isNaN(lat) && !isNaN(lng) && !(lat === 0 && lng === 0)
  if (validCoords && !isLondonCoord(lat, lng)) { skipped++; continue }
  if (!validCoords && !addressMentionsLondon(row.Address)) { skipped++; continue }

  const venue: Record<string, unknown> = {
    id: slugify(venueName || name) + '-venue',
    name: venueName,
    address: row.Address.trim(),
    area: '',
    location: { lat: isNaN(lat) ? 0 : lat, lng: isNaN(lng) ? 0 : lng },
  }

  const contact = (row['Contact / Book a Spot'] ?? '').trim()
  const howToBook = { contact }

  const wheelchair = mapWheelchair(row['Wheelchair Access'])

  const website = cleanSocial(row.Website)
  const facebook = cleanSocial(row['Facebook Page'])
  const facebookGroup = cleanSocial(row['Facebook Group'])
  const instagram = mapInstagram(row.Instagram)
  const socials: Record<string, string> = {}
  if (website) socials.website = website
  if (facebook) socials.facebook = facebook
  if (facebookGroup) socials.facebookGroup = facebookGroup
  if (instagram) socials.instagram = instagram

  const lastVerified = parseDate(row['Last Update']) || new Date().toISOString().slice(0, 10)

  const bringerObj: Record<string, unknown> = { required: bringer.required }
  if (bringer.note) bringerObj.note = bringer.note

  inserts.push(
    `  (${[
      quote(id),
      quote(name),
      quote(row['Event Description'].trim()),
      quote(type),
      textArray(levels),
      jsonb(bringerObj),
      jsonb(schedules),
      jsonb(venue),
      jsonb(howToBook),
      nullable(wheelchair),
      jsonb(socials),
      quote('active'),
      quote(lastVerified),
    ].join(', ')})`
  )
}

lines.push(inserts.join(',\n') + ';')
lines.push('')
lines.push(`-- Imported: ${inserts.length} rows, skipped: ${skipped} (non-London, Festival, Course/Workshop-only, or missing data)`)

writeFileSync(outPath, lines.join('\n'), 'utf-8')
console.log(`Written ${inserts.length} rows to ${outPath} (${skipped} skipped)`)
