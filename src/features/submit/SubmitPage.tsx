import { useState } from 'react'
import { Link } from 'react-router-dom'
import { submitNight, publishSubmission } from '../../services/submissionsService'
import { useAuth } from '../auth/AuthContext'
import Header from '../../components/Header'
import { isSupabaseConfigured } from '../../services/supabase'
import { geocodeVenue, isLondonCoord } from '../../utils/geocode'
import type { NightSubmission, NightType, Level } from '../../types/comedyNight'
import {
  AboutSection,
  ScheduleSection,
  VenueSection,
  PricingSection,
  BookingSection,
  SocialsSection,
  Field,
  inputCls,
  sectionCls,
  sectionHeadingCls,
} from '../../components/NightFormFields'

type SubmitState = 'idle' | 'checking' | 'submitting' | 'done' | 'error'

const EMPTY: NightSubmission = {
  name: '',
  description: '',
  type: 'open-mic',
  levels: [],
  bringerRequired: false,
  schedules: [{ frequency: 'weekly', weekday: 1, startTime: '20:00' }],
  venueName: '',
  venueAddress: '',
}

export default function SubmitPage() {
  const { isAdmin, user } = useAuth()
  const [form, setForm] = useState<NightSubmission>(EMPTY)
  const [state, setState] = useState<SubmitState>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  function set<K extends keyof NightSubmission>(key: K, value: NightSubmission[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isSupabaseConfigured) return
    setState('checking')
    setErrorMsg('')
    let coords: { lat: number; lng: number } | null = null
    try {
      coords = await geocodeVenue(form.venueName, form.venueAddress)
      if (coords && !isLondonCoord(coords.lat, coords.lng)) {
        setErrorMsg('This location doesn\'t appear to be in London. FindComedy only lists London comedy nights.')
        setState('error')
        return
      }
    } catch {
      // If geocoding fails entirely, allow the submission through
    }
    setState('submitting')
    try {
      if (isAdmin) {
        await publishSubmission(form, coords)
      } else {
        await submitNight(form, user?.id)
      }
      setState('done')
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong')
      setState('error')
    }
  }

  if (state === 'done') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-white flex flex-col items-center justify-center gap-6 px-4">
        <div className="text-4xl">🎤</div>
        <h1 className="text-2xl font-display font-bold">{isAdmin ? 'Night published!' : 'Night submitted!'}</h1>
        <p className="text-gray-500 dark:text-zinc-400 text-center max-w-sm">
          {isAdmin
            ? 'The night is now live in the listings.'
            : "Thanks! We'll review your submission and add it to the listings if everything checks out."}
        </p>
        <Link to="/" className="px-5 py-2.5 rounded-xl bg-amber-500 text-white font-semibold text-sm hover:bg-amber-600 transition-colors">
          Back to browse
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-white">
      <Header />

      <main className="max-w-2xl mx-auto px-4 py-8 flex flex-col gap-8">
        <div>
          <h1 className="text-2xl font-display font-bold">Submit a comedy night</h1>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
            Know a night that should be listed? Fill in what you know — we'll verify the rest.
          </p>
        </div>

        {!isSupabaseConfigured && (
          <div className="rounded-xl bg-amber-50 dark:bg-amber-950/40 ring-1 ring-amber-200 dark:ring-amber-800 p-4">
            <p className="text-sm text-amber-700 dark:text-amber-400">
              Submissions are not available in preview mode. Connect Supabase to enable this feature.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <AboutSection
            name={form.name} onNameChange={(v) => set('name', v)}
            description={form.description} onDescriptionChange={(v) => set('description', v)}
            type={form.type as NightType} onTypeChange={(v) => set('type', v)}
            levels={form.levels as Level[]} onLevelsChange={(v) => set('levels', v)}
          />

          <ScheduleSection
            schedules={form.schedules}
            onSchedulesChange={(v) => set('schedules', v)}
          />

          <VenueSection
            venueName={form.venueName} onVenueNameChange={(v) => set('venueName', v)}
            venueAddress={form.venueAddress} onVenueAddressChange={(v) => set('venueAddress', v)}
          />

          <PricingSection
            bringerRequired={form.bringerRequired} onBringerRequiredChange={(v) => set('bringerRequired', v)}
            bringerCount={form.bringerCount} onBringerCountChange={(v) => set('bringerCount', v)}
            bringerNote={form.bringerNote} onBringerNoteChange={(v) => set('bringerNote', v)}
          />

          <BookingSection
            contact={form.contact} onContactChange={(v) => set('contact', v)}
          />

          <SocialsSection
            website={form.website} onWebsiteChange={(v) => set('website', v)}
            instagram={form.instagram} onInstagramChange={(v) => set('instagram', v)}
            facebook={form.facebook} onFacebookChange={(v) => set('facebook', v)}
          />

          <section className={sectionCls}>
            <h2 className={sectionHeadingCls}>Your note</h2>
            <Field label="Anything else we should know">
              <textarea value={form.submitterNote ?? ''} onChange={(e) => set('submitterNote', e.target.value || undefined)} rows={2} maxLength={500} placeholder="e.g. I'm the promoter, the night runs on the last Thursday of each month…" className={`${inputCls} resize-none`} />
            </Field>
          </section>

          {state === 'error' && (
            <p className="text-sm text-red-500 text-center">{errorMsg}</p>
          )}

          <button
            type="submit"
            disabled={!isSupabaseConfigured || state === 'checking' || state === 'submitting'}
            className="w-full py-3 rounded-xl bg-amber-500 text-white font-semibold text-sm hover:bg-amber-600 transition-colors disabled:opacity-50"
          >
            {state === 'checking' ? 'Checking location…' : state === 'submitting' ? 'Submitting…' : isAdmin ? 'Publish night' : 'Submit night for review'}
          </button>
        </form>
      </main>
    </div>
  )
}
