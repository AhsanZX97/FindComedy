import { useState } from 'react'
import { Link } from 'react-router-dom'
import { submitNight } from '../../services/submissionsService'
import Header from '../../components/Header'
import { isSupabaseConfigured } from '../../services/supabase'
import type { NightSubmission, NightType, Level, Frequency, Weekday } from '../../types/comedyNight'

const WEEKDAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

type SubmitState = 'idle' | 'submitting' | 'done' | 'error'

const EMPTY: NightSubmission = {
  name: '',
  description: '',
  type: 'open-mic',
  levels: [],
  bringerRequired: false,
  frequency: 'weekly',
  weekday: 1,
  startTime: '20:00',
  venueName: '',
  venueAddress: '',
  venueArea: '',
  entry: 'Free',
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
        {label}{required && <span className="text-amber-400 ml-1">*</span>}
      </label>
      {children}
    </div>
  )
}

const inputCls =
  'w-full rounded-lg bg-zinc-900 ring-1 ring-zinc-800 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-amber-500'

const selectCls = `${inputCls} appearance-none`

export default function SubmitPage() {
  const [form, setForm] = useState<NightSubmission>(EMPTY)
  const [state, setState] = useState<SubmitState>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  function set<K extends keyof NightSubmission>(key: K, value: NightSubmission[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function toggleLevel(level: Level) {
    set('levels', form.levels.includes(level)
      ? form.levels.filter((l) => l !== level)
      : [...form.levels, level])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isSupabaseConfigured) return
    setState('submitting')
    try {
      await submitNight(form)
      setState('done')
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong')
      setState('error')
    }
  }

  if (state === 'done') {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center gap-6 px-4">
        <div className="text-4xl">🎤</div>
        <h1 className="text-2xl font-display font-bold text-white">Night submitted!</h1>
        <p className="text-zinc-400 text-center max-w-sm">
          Thanks! We'll review your submission and add it to the listings if everything checks out.
        </p>
        <Link to="/" className="px-5 py-2.5 rounded-xl bg-amber-500 text-zinc-950 font-semibold text-sm hover:bg-amber-400 transition-colors">
          Back to browse
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <Header />

      <main className="max-w-2xl mx-auto px-4 py-8 flex flex-col gap-8">
        <div>
          <h1 className="text-2xl font-display font-bold">Submit a comedy night</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Know a night that should be listed? Fill in what you know — we'll verify the rest.
          </p>
        </div>

        {!isSupabaseConfigured && (
          <div className="rounded-xl bg-zinc-900 ring-1 ring-amber-800 p-4">
            <p className="text-sm text-amber-400">
              Submissions are not available in preview mode. Connect Supabase to enable this feature.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* Basic info */}
          <section className="flex flex-col gap-4 rounded-2xl bg-zinc-900 ring-1 ring-zinc-800 p-5">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500">About the night</h2>

            <Field label="Night name" required>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder="e.g. Knock2Bag"
                className={inputCls}
              />
            </Field>

            <Field label="Description" required>
              <textarea
                required
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                rows={3}
                maxLength={500}
                placeholder="What makes this night special?"
                className={`${inputCls} resize-none`}
              />
            </Field>

            <Field label="Type" required>
              <select
                value={form.type}
                onChange={(e) => set('type', e.target.value as NightType)}
                className={selectCls}
              >
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
                    <input
                      type="checkbox"
                      checked={form.levels.includes(level)}
                      onChange={() => toggleLevel(level)}
                      className="accent-amber-400"
                    />
                    <span className="text-sm text-zinc-300 capitalize">{level}</span>
                  </label>
                ))}
              </div>
            </Field>
          </section>

          {/* Schedule */}
          <section className="flex flex-col gap-4 rounded-2xl bg-zinc-900 ring-1 ring-zinc-800 p-5">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Schedule</h2>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Frequency" required>
                <select
                  value={form.frequency}
                  onChange={(e) => set('frequency', e.target.value as Frequency)}
                  className={selectCls}
                >
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Every other week</option>
                  <option value="monthly">Monthly</option>
                  <option value="irregular">Irregular</option>
                </select>
              </Field>

              <Field label="Day" required>
                <select
                  value={form.weekday}
                  onChange={(e) => set('weekday', Number(e.target.value) as Weekday)}
                  className={selectCls}
                >
                  {WEEKDAY_LABELS.map((day, i) => (
                    <option key={day} value={i}>{day}</option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label="Start time" required>
              <input
                type="time"
                required
                value={form.startTime}
                onChange={(e) => set('startTime', e.target.value)}
                className={inputCls}
              />
            </Field>

            <Field label="Schedule note">
              <input
                type="text"
                value={form.scheduleNote ?? ''}
                onChange={(e) => set('scheduleNote', e.target.value || undefined)}
                placeholder="e.g. doors at 7pm, show at 8pm"
                className={inputCls}
              />
            </Field>
          </section>

          {/* Venue */}
          <section className="flex flex-col gap-4 rounded-2xl bg-zinc-900 ring-1 ring-zinc-800 p-5">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Venue</h2>

            <Field label="Venue name" required>
              <input
                type="text"
                required
                value={form.venueName}
                onChange={(e) => set('venueName', e.target.value)}
                placeholder="e.g. The Camden Head"
                className={inputCls}
              />
            </Field>

            <Field label="Address" required>
              <input
                type="text"
                required
                value={form.venueAddress}
                onChange={(e) => set('venueAddress', e.target.value)}
                placeholder="e.g. 100 Camden High St, London NW1 0LU"
                className={inputCls}
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Area" required>
                <input
                  type="text"
                  required
                  value={form.venueArea}
                  onChange={(e) => set('venueArea', e.target.value)}
                  placeholder="e.g. Camden"
                  className={inputCls}
                />
              </Field>

              <Field label="Nearest tube">
                <input
                  type="text"
                  value={form.venueNearestStation ?? ''}
                  onChange={(e) => set('venueNearestStation', e.target.value || undefined)}
                  placeholder="e.g. Camden Town"
                  className={inputCls}
                />
              </Field>
            </div>
          </section>

          {/* Pricing & bringer */}
          <section className="flex flex-col gap-4 rounded-2xl bg-zinc-900 ring-1 ring-zinc-800 p-5">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Pricing</h2>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Entry price" required>
                <input
                  type="text"
                  required
                  value={form.entry}
                  onChange={(e) => set('entry', e.target.value)}
                  placeholder="e.g. Free, £5, bucket"
                  className={inputCls}
                />
              </Field>

              <Field label="Performer pay">
                <input
                  type="text"
                  value={form.performerPay ?? ''}
                  onChange={(e) => set('performerPay', e.target.value || undefined)}
                  placeholder="e.g. £10, expenses"
                  className={inputCls}
                />
              </Field>
            </div>

            <Field label="Bringer policy">
              <div className="flex flex-col gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.bringerRequired}
                    onChange={(e) => set('bringerRequired', e.target.checked)}
                    className="accent-amber-400"
                  />
                  <span className="text-sm text-zinc-300">Bringer required</span>
                </label>
                {form.bringerRequired && (
                  <div className="grid grid-cols-2 gap-4 pl-6">
                    <Field label="How many guests">
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={form.bringerCount ?? ''}
                        onChange={(e) => set('bringerCount', e.target.value ? Number(e.target.value) : undefined)}
                        placeholder="e.g. 2"
                        className={inputCls}
                      />
                    </Field>
                    <Field label="Note">
                      <input
                        type="text"
                        value={form.bringerNote ?? ''}
                        onChange={(e) => set('bringerNote', e.target.value || undefined)}
                        placeholder="e.g. paying guests"
                        className={inputCls}
                      />
                    </Field>
                  </div>
                )}
              </div>
            </Field>
          </section>

          {/* Booking info */}
          <section className="flex flex-col gap-4 rounded-2xl bg-zinc-900 ring-1 ring-zinc-800 p-5">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500">How to attend</h2>

            <Field label="Audience booking">
              <input
                type="text"
                value={form.audienceBooking ?? ''}
                onChange={(e) => set('audienceBooking', e.target.value || undefined)}
                placeholder="e.g. Free walk-in, or link to tickets"
                className={inputCls}
              />
            </Field>

            <Field label="Performer sign-up">
              <input
                type="text"
                value={form.performerBooking ?? ''}
                onChange={(e) => set('performerBooking', e.target.value || undefined)}
                placeholder="e.g. Email the host or DM on Instagram"
                className={inputCls}
              />
            </Field>
          </section>

          {/* Socials */}
          <section className="flex flex-col gap-4 rounded-2xl bg-zinc-900 ring-1 ring-zinc-800 p-5">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Socials</h2>

            <Field label="Website">
              <input
                type="url"
                value={form.website ?? ''}
                onChange={(e) => set('website', e.target.value || undefined)}
                placeholder="https://…"
                className={inputCls}
              />
            </Field>

            <Field label="Instagram">
              <input
                type="url"
                value={form.instagram ?? ''}
                onChange={(e) => set('instagram', e.target.value || undefined)}
                placeholder="https://instagram.com/…"
                className={inputCls}
              />
            </Field>

            <Field label="Facebook">
              <input
                type="url"
                value={form.facebook ?? ''}
                onChange={(e) => set('facebook', e.target.value || undefined)}
                placeholder="https://facebook.com/…"
                className={inputCls}
              />
            </Field>
          </section>

          {/* Submitter note */}
          <section className="flex flex-col gap-4 rounded-2xl bg-zinc-900 ring-1 ring-zinc-800 p-5">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Your note</h2>
            <Field label="Anything else we should know">
              <textarea
                value={form.submitterNote ?? ''}
                onChange={(e) => set('submitterNote', e.target.value || undefined)}
                rows={2}
                maxLength={500}
                placeholder="e.g. I'm the promoter, the night runs on the last Thursday of each month…"
                className={`${inputCls} resize-none`}
              />
            </Field>
          </section>

          {state === 'error' && (
            <p className="text-sm text-red-400 text-center">{errorMsg}</p>
          )}

          <button
            type="submit"
            disabled={!isSupabaseConfigured || state === 'submitting'}
            className="w-full py-3 rounded-xl bg-amber-500 text-zinc-950 font-semibold text-sm hover:bg-amber-400 transition-colors disabled:opacity-50"
          >
            {state === 'submitting' ? 'Submitting…' : 'Submit night for review'}
          </button>
        </form>
      </main>
    </div>
  )
}
