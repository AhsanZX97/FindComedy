import type { ComedyNight, NightType, Schedule } from '../types/comedyNight'
import { WEEKDAY_LONG_LABELS, formatTime } from './formatSchedule'

export const TYPE_LABELS: Record<NightType, string> = {
  'open-mic': 'Open Mic',
  showcase: 'Showcase',
  pro: 'Pro Night',
  mixed: 'Mixed Bill',
}

/** Same labels in sentence case, for use mid-prose in the meta description. */
const TYPE_LABELS_PROSE: Record<NightType, string> = {
  'open-mic': 'Open mic',
  showcase: 'Showcase',
  pro: 'Pro night',
  mixed: 'Mixed bill',
}

const FREQ_PREFIXES: Record<Schedule['frequency'], string> = {
  weekly: 'every',
  biweekly: 'every other',
  monthly: 'monthly on',
  irregular: '',
}

/** Google truncates titles on pixel width; ~60 characters is the safe budget. */
export const TITLE_MAX = 60
/** Descriptions beyond ~155 characters get cut in the SERP snippet. */
export const DESCRIPTION_MAX = 155
/** Below this, a trailing prose fragment is noise rather than information. */
const MIN_PROSE = 40

/** Truncate to `max` at a word boundary, marking the cut with an ellipsis. */
function clip(text: string, max: number): string {
  if (text.length <= max) return text
  const hard = text.slice(0, max - 1)
  const lastSpace = hard.lastIndexOf(' ')
  const cut = lastSpace > 0 ? hard.slice(0, lastSpace) : hard
  return `${cut.replace(/[\s,;:—-]+$/, '')}…`
}

/** "every Monday, 8pm" — the frequency prefix is dropped for irregular nights. */
function scheduleEntryPhrase(s: Schedule): string {
  const time = formatTime(s.startTime)
  if (s.frequency === 'irregular') return time
  const day = WEEKDAY_LONG_LABELS[s.weekday]
  return `${FREQ_PREFIXES[s.frequency]} ${day}, ${time}`
}

/**
 * Names up to two of a night's schedules in full and summarises any beyond that,
 * so a night running four times a week doesn't blow the description budget.
 */
function schedulePhrase(schedules: Schedule[]): string {
  if (schedules.length === 0) return ''
  const [first, second] = schedules
  if (schedules.length === 1) return scheduleEntryPhrase(first)
  if (schedules.length === 2) {
    return `${scheduleEntryPhrase(first)} and ${scheduleEntryPhrase(second)}`
  }
  const rest = schedules.length - 1
  return `${scheduleEntryPhrase(first)} and ${rest} more nights`
}

/** "Open mic at Cavendish Arms, Stockwell: every Monday, 8pm." */
function factSentence(night: ComedyNight): string {
  const area = night.venue.area ? `, ${night.venue.area}` : ''
  const where = `${TYPE_LABELS_PROSE[night.type]} at ${night.venue.name}${area}`
  const when = schedulePhrase(night.schedules ?? [])
  return when ? `${where}: ${when}.` : `${where}.`
}

/** The single fact a comedian checks before turning up. */
function bringerSentence({ bringer }: ComedyNight): string {
  if (!bringer.required) return 'No bringer required.'
  if (bringer.count === undefined) return 'Bringer night.'
  return `Bringer: bring ${bringer.count} ${bringer.count === 1 ? 'guest' : 'guests'}.`
}

/**
 * Titles shed their least valuable trailing part until they fit the budget, so a
 * long night name costs the site brand rather than truncating mid-word in the SERP.
 */
function buildTitle(night: ComedyNight): string {
  const type = TYPE_LABELS[night.type]
  // A night called "Waterloo Comedy Crew" in Waterloo shouldn't say Waterloo twice.
  const area = night.venue.area
  const areaIsRedundant = !area || night.name.toLowerCase().includes(area.toLowerCase())
  const inArea = areaIsRedundant ? '' : ` in ${area}`

  const candidates = [
    `${night.name} — ${type}${inArea}, London | FindComedy`,
    `${night.name} — ${type}${inArea}, London`,
    `${night.name} — ${type}, London`,
    `${night.name} — ${type}`,
    night.name,
  ]
  return candidates.find((c) => c.length <= TITLE_MAX) ?? clip(night.name, TITLE_MAX)
}

/**
 * Leads with the facts a searcher wants — what kind of night, where, when, and
 * whether they need to bring someone — then spends whatever budget is left on the
 * night's own prose. Built from structured fields so every night gets a usable
 * snippet even when its description is empty.
 */
function buildDescription(night: ComedyNight): string {
  let out = `${factSentence(night)} ${bringerSentence(night)}`
  const prose = night.description.trim()
  if (prose) {
    const remaining = DESCRIPTION_MAX - out.length - 1
    if (remaining >= MIN_PROSE) out = `${out} ${clip(prose, remaining)}`
  }
  return out
}

export interface NightSeo {
  title: string
  description: string
}

/**
 * Title and meta description for a night's page. Single source of truth shared by
 * the runtime SEO hook and the build-time prerenderer so the static HTML and the
 * hydrated DOM stay in sync.
 */
export function nightSeo(night: ComedyNight): NightSeo {
  return {
    title: buildTitle(night),
    description: buildDescription(night),
  }
}
