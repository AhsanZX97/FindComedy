import type { NightType, Level, Frequency, Weekday } from '../types/comedyNight'

export const WEEKDAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export function Field({ label, required, children }: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-zinc-500">
        {label}{required && <span className="text-amber-500 ml-1">*</span>}
      </label>
      {children}
    </div>
  )
}

export const inputCls =
  'w-full rounded-lg bg-white dark:bg-zinc-800 ring-1 ring-gray-200 dark:ring-zinc-700 px-3 py-2 text-sm text-gray-800 dark:text-zinc-200 placeholder-gray-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-amber-400'

export const selectCls = `${inputCls} appearance-none`

export const sectionCls = 'flex flex-col gap-4 rounded-2xl bg-white dark:bg-zinc-900 ring-1 ring-gray-200 dark:ring-zinc-800 p-5'
export const sectionHeadingCls = 'text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-zinc-500'

// ── About section ─────────────────────────────────────────────────────────────

interface AboutProps {
  name: string; onNameChange: (v: string) => void
  description: string; onDescriptionChange: (v: string) => void
  type: NightType; onTypeChange: (v: NightType) => void
  levels: Level[]; onLevelsChange: (v: Level[]) => void
}

export function AboutSection({ name, onNameChange, description, onDescriptionChange, type, onTypeChange, levels, onLevelsChange }: AboutProps) {
  function toggleLevel(level: Level) {
    onLevelsChange(levels.includes(level) ? levels.filter((l) => l !== level) : [...levels, level])
  }
  return (
    <section className={sectionCls}>
      <h2 className={sectionHeadingCls}>About the night</h2>
      <Field label="Night name" required>
        <input type="text" required value={name} onChange={(e) => onNameChange(e.target.value)} placeholder="e.g. Knock2Bag" className={inputCls} />
      </Field>
      <Field label="Description" required>
        <textarea required value={description} onChange={(e) => onDescriptionChange(e.target.value)} rows={3} maxLength={500} placeholder="What makes this night special?" className={`${inputCls} resize-none`} />
      </Field>
      <Field label="Type" required>
        <select value={type} onChange={(e) => onTypeChange(e.target.value as NightType)} className={selectCls}>
          <option value="open-mic">Open Mic</option>
          <option value="showcase">Showcase</option>
          <option value="pro">Pro Night</option>
          <option value="mixed">Mixed Bill</option>
        </select>
      </Field>
      <Field label="Level">
        <div className="flex flex-wrap gap-2">
          {(['new', 'experienced', 'pro'] as Level[]).map((level) => (
            <label key={level} className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={levels.includes(level)} onChange={() => toggleLevel(level)} className="accent-amber-500" />
              <span className="text-sm text-gray-700 dark:text-zinc-300 capitalize">{level}</span>
            </label>
          ))}
        </div>
      </Field>
    </section>
  )
}

// ── Schedule section ───────────────────────────────────────────────────────────

interface ScheduleProps {
  frequency: Frequency; onFrequencyChange: (v: Frequency) => void
  weekday: Weekday; onWeekdayChange: (v: Weekday) => void
  startTime: string; onStartTimeChange: (v: string) => void
  scheduleNote?: string; onScheduleNoteChange: (v: string | undefined) => void
}

export function ScheduleSection({ frequency, onFrequencyChange, weekday, onWeekdayChange, startTime, onStartTimeChange, scheduleNote, onScheduleNoteChange }: ScheduleProps) {
  return (
    <section className={sectionCls}>
      <h2 className={sectionHeadingCls}>Schedule</h2>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Frequency" required>
          <select value={frequency} onChange={(e) => onFrequencyChange(e.target.value as Frequency)} className={selectCls}>
            <option value="weekly">Weekly</option>
            <option value="biweekly">Every other week</option>
            <option value="monthly">Monthly</option>
            <option value="irregular">Irregular</option>
          </select>
        </Field>
        <Field label="Day" required>
          <select value={weekday} onChange={(e) => onWeekdayChange(Number(e.target.value) as Weekday)} className={selectCls}>
            {WEEKDAY_LABELS.map((day, i) => (<option key={day} value={i}>{day}</option>))}
          </select>
        </Field>
      </div>
      <Field label="Start time" required>
        <input type="time" required value={startTime} onChange={(e) => onStartTimeChange(e.target.value)} className={inputCls} />
      </Field>
      <Field label="Schedule note">
        <input type="text" value={scheduleNote ?? ''} onChange={(e) => onScheduleNoteChange(e.target.value || undefined)} placeholder="e.g. doors at 7pm, show at 8pm" className={inputCls} />
      </Field>
    </section>
  )
}

// ── Venue section ──────────────────────────────────────────────────────────────

interface VenueProps {
  venueName: string; onVenueNameChange: (v: string) => void
  venueAddress: string; onVenueAddressChange: (v: string) => void
  venueArea: string; onVenueAreaChange: (v: string) => void
  venueNearestStation?: string; onVenueNearestStationChange: (v: string | undefined) => void
  children?: React.ReactNode
}

export function VenueSection({ venueName, onVenueNameChange, venueAddress, onVenueAddressChange, venueArea, onVenueAreaChange, venueNearestStation, onVenueNearestStationChange, children }: VenueProps) {
  return (
    <section className={sectionCls}>
      <h2 className={sectionHeadingCls}>Venue</h2>
      <Field label="Venue name" required>
        <input type="text" required value={venueName} onChange={(e) => onVenueNameChange(e.target.value)} placeholder="e.g. The Camden Head" className={inputCls} />
      </Field>
      <Field label="Address" required>
        <input type="text" required value={venueAddress} onChange={(e) => onVenueAddressChange(e.target.value)} placeholder="e.g. 100 Camden High St, London NW1 0LU" className={inputCls} />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Area" required>
          <input type="text" required value={venueArea} onChange={(e) => onVenueAreaChange(e.target.value)} placeholder="e.g. Camden" className={inputCls} />
        </Field>
        <Field label="Nearest tube">
          <input type="text" value={venueNearestStation ?? ''} onChange={(e) => onVenueNearestStationChange(e.target.value || undefined)} placeholder="e.g. Camden Town" className={inputCls} />
        </Field>
      </div>
      {children}
    </section>
  )
}

// ── Pricing section ────────────────────────────────────────────────────────────

interface PricingProps {
  entry: string; onEntryChange: (v: string) => void
  performerPay?: string; onPerformerPayChange: (v: string | undefined) => void
  bringerRequired: boolean; onBringerRequiredChange: (v: boolean) => void
  bringerCount?: number; onBringerCountChange: (v: number | undefined) => void
  bringerNote?: string; onBringerNoteChange: (v: string | undefined) => void
}

export function PricingSection({ entry, onEntryChange, performerPay, onPerformerPayChange, bringerRequired, onBringerRequiredChange, bringerCount, onBringerCountChange, bringerNote, onBringerNoteChange }: PricingProps) {
  return (
    <section className={sectionCls}>
      <h2 className={sectionHeadingCls}>Pricing</h2>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Entry price" required>
          <input type="text" required value={entry} onChange={(e) => onEntryChange(e.target.value)} placeholder="e.g. Free, £5, bucket" className={inputCls} />
        </Field>
        <Field label="Performer pay">
          <input type="text" value={performerPay ?? ''} onChange={(e) => onPerformerPayChange(e.target.value || undefined)} placeholder="e.g. £10, expenses" className={inputCls} />
        </Field>
      </div>
      <Field label="Bringer policy">
        <div className="flex flex-col gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={bringerRequired} onChange={(e) => onBringerRequiredChange(e.target.checked)} className="accent-amber-500" />
            <span className="text-sm text-gray-700 dark:text-zinc-300">Bringer required</span>
          </label>
          {bringerRequired && (
            <div className="grid grid-cols-2 gap-4 pl-6">
              <Field label="How many guests">
                <input type="number" min={1} max={10} value={bringerCount ?? ''} onChange={(e) => onBringerCountChange(e.target.value ? Number(e.target.value) : undefined)} placeholder="e.g. 2" className={inputCls} />
              </Field>
              <Field label="Note">
                <input type="text" value={bringerNote ?? ''} onChange={(e) => onBringerNoteChange(e.target.value || undefined)} placeholder="e.g. paying guests" className={inputCls} />
              </Field>
            </div>
          )}
        </div>
      </Field>
    </section>
  )
}

// ── Booking section ────────────────────────────────────────────────────────────

interface BookingProps {
  audienceBooking?: string; onAudienceBookingChange: (v: string | undefined) => void
  performerBooking?: string; onPerformerBookingChange: (v: string | undefined) => void
}

export function BookingSection({ audienceBooking, onAudienceBookingChange, performerBooking, onPerformerBookingChange }: BookingProps) {
  return (
    <section className={sectionCls}>
      <h2 className={sectionHeadingCls}>How to attend</h2>
      <Field label="Audience booking">
        <input type="text" value={audienceBooking ?? ''} onChange={(e) => onAudienceBookingChange(e.target.value || undefined)} placeholder="e.g. Free walk-in, or link to tickets" className={inputCls} />
      </Field>
      <Field label="Performer sign-up">
        <input type="text" value={performerBooking ?? ''} onChange={(e) => onPerformerBookingChange(e.target.value || undefined)} placeholder="e.g. Email the host or DM on Instagram" className={inputCls} />
      </Field>
    </section>
  )
}

// ── Socials section ────────────────────────────────────────────────────────────

interface SocialsProps {
  website?: string; onWebsiteChange: (v: string | undefined) => void
  instagram?: string; onInstagramChange: (v: string | undefined) => void
  facebook?: string; onFacebookChange: (v: string | undefined) => void
  children?: React.ReactNode
}

export function SocialsSection({ website, onWebsiteChange, instagram, onInstagramChange, facebook, onFacebookChange, children }: SocialsProps) {
  return (
    <section className={sectionCls}>
      <h2 className={sectionHeadingCls}>Socials</h2>
      <Field label="Website">
        <input type="url" value={website ?? ''} onChange={(e) => onWebsiteChange(e.target.value || undefined)} placeholder="https://…" className={inputCls} />
      </Field>
      <Field label="Instagram">
        <input type="url" value={instagram ?? ''} onChange={(e) => onInstagramChange(e.target.value || undefined)} placeholder="https://instagram.com/…" className={inputCls} />
      </Field>
      <Field label="Facebook">
        <input type="url" value={facebook ?? ''} onChange={(e) => onFacebookChange(e.target.value || undefined)} placeholder="https://facebook.com/…" className={inputCls} />
      </Field>
      {children}
    </section>
  )
}
