import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { getSubmissionById, setSubmissionStatus } from '../../services/submissionsService'
import { upsertNight } from '../../services/nightsService'
import { geocodeVenue, isLondonCoord } from '../../utils/geocode'
import type {
  StoredSubmission,
  ComedyNight,
  NightSubmission,
  NightType,
  Level,
  Frequency,
  Weekday,
} from '../../types/comedyNight'
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
import Header from '../../components/Header'
import RequireAdmin from './RequireAdmin'

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60)
}

type GeoStatus = 'idle' | 'loading' | 'london' | 'outside' | 'not-found'
type ActionState = 'idle' | 'approving' | 'rejecting' | 'error'

function AdminSubmissionReviewInner() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [sub, setSub] = useState<StoredSubmission | null>(null)
  const [form, setForm] = useState<NightSubmission | null>(null)
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [geoStatus, setGeoStatus] = useState<GeoStatus>('idle')
  const [actionState, setActionState] = useState<ActionState>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) { setLoading(false); return }
    getSubmissionById(id)
      .then((s) => {
        if (s) { setSub(s); setForm(s.data) }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [id])

  // Auto-geocode when address or venue name changes
  useEffect(() => {
    if (!form?.venueAddress || form.venueAddress.length < 5) return
    setGeoStatus('loading')
    const timer = setTimeout(async () => {
      const result = await geocodeVenue(form.venueName, form.venueAddress)
      if (result) {
        setCoords(result)
        setGeoStatus(isLondonCoord(result.lat, result.lng) ? 'london' : 'outside')
      } else {
        setCoords(null)
        setGeoStatus('not-found')
      }
    }, 800)
    return () => clearTimeout(timer)
  }, [form?.venueAddress, form?.venueName])

  function setField<K extends keyof NightSubmission>(key: K, value: NightSubmission[K]) {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev))
  }

  async function handleApprove() {
    if (!sub || !form) return
    setActionState('approving')
    setErrorMsg('')
    try {
      const night: ComedyNight = {
        id: slugify(form.name) + '-' + sub.id.slice(0, 8),
        name: form.name,
        description: form.description,
        type: form.type,
        levels: form.levels,
        bringer: {
          required: form.bringerRequired,
          count: form.bringerCount,
          note: form.bringerNote,
        },
        schedule: {
          frequency: form.frequency,
          weekday: form.weekday,
          startTime: form.startTime,
          note: form.scheduleNote,
        },
        venue: {
          id: slugify(form.venueName) + '-venue',
          name: form.venueName,
          address: form.venueAddress,
          area: '',
          location: coords ?? { lat: 0, lng: 0 },
        },
        pricing: {
          entry: form.entry,
          performerPay: form.performerPay,
        },
        howToBook: {
          audience: form.audienceBooking,
          performers: form.performerBooking,
        },
        socials: {
          website: form.website,
          instagram: form.instagram,
          facebook: form.facebook,
        },
        status: 'active',
        lastVerified: new Date().toISOString().slice(0, 10),
      }
      await upsertNight(night)
      await setSubmissionStatus(sub.id, 'approved')
      navigate('/admin/queue')
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Approve failed')
      setActionState('error')
    }
  }

  async function handleReject() {
    if (!sub) return
    setActionState('rejecting')
    setErrorMsg('')
    try {
      await setSubmissionStatus(sub.id, 'rejected')
      navigate('/admin/queue')
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Reject failed')
      setActionState('error')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!sub || !form) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-white flex flex-col items-center justify-center gap-4">
        <p className="text-gray-400 dark:text-zinc-500">Submission not found.</p>
        <Link to="/admin/queue" className="text-amber-500 text-sm hover:underline">← Back to queue</Link>
      </div>
    )
  }

  const isPending = sub.status === 'pending'
  const busy = actionState === 'approving' || actionState === 'rejecting'

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-white">
      <Header />
      <main className="max-w-2xl mx-auto px-4 py-8 flex flex-col gap-6">
        <div>
          <Link to="/admin/queue" className="text-xs text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300 transition-colors">
            ← Back to queue
          </Link>
          <div className="flex items-center gap-3 mt-1">
            <h1 className="text-2xl font-display font-bold">{form.name}</h1>
            <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${
              sub.status === 'pending'
                ? 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800'
                : sub.status === 'approved'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800'
                  : 'bg-red-50 text-red-600 border border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800'
            }`}>
              {sub.status}
            </span>
          </div>
          <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">
            Submitted {new Date(sub.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        {sub.submitterNote && (
          <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 ring-1 ring-amber-200 dark:ring-amber-800 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-amber-600 dark:text-amber-400 mb-1">Submitter note</p>
            <p className="text-sm text-amber-800 dark:text-amber-300">{sub.submitterNote}</p>
          </div>
        )}

        <AboutSection
          name={form.name} onNameChange={(v) => setField('name', v)}
          description={form.description} onDescriptionChange={(v) => setField('description', v)}
          type={form.type as NightType} onTypeChange={(v) => setField('type', v)}
          levels={form.levels as Level[]} onLevelsChange={(v) => setField('levels', v)}
        />

        <ScheduleSection
          frequency={form.frequency as Frequency} onFrequencyChange={(v) => setField('frequency', v)}
          weekday={form.weekday as Weekday} onWeekdayChange={(v) => setField('weekday', v)}
          startTime={form.startTime} onStartTimeChange={(v) => setField('startTime', v)}
          scheduleNote={form.scheduleNote} onScheduleNoteChange={(v) => setField('scheduleNote', v)}
        />

        <VenueSection
          venueName={form.venueName} onVenueNameChange={(v) => setField('venueName', v)}
          venueAddress={form.venueAddress} onVenueAddressChange={(v) => setField('venueAddress', v)}
        >
          <div className="flex items-center gap-2">
            {geoStatus === 'loading' && <span className="text-xs text-gray-400 dark:text-zinc-500">Checking location…</span>}
            {geoStatus === 'london' && (
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">London location confirmed</span>
            )}
            {geoStatus === 'outside' && (
              <span className="text-xs font-medium text-red-500">Outside London — verify the address</span>
            )}
            {geoStatus === 'not-found' && (
              <span className="text-xs font-medium text-amber-500">Location not found — address may need correction</span>
            )}
          </div>
          {coords && (
            <section className={sectionCls}>
              <h2 className={sectionHeadingCls}>Resolved coordinates</h2>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Latitude">
                  <input type="number" step="any" value={coords.lat} onChange={(e) => setCoords((c) => c ? { ...c, lat: Number(e.target.value) } : c)} className={inputCls} />
                </Field>
                <Field label="Longitude">
                  <input type="number" step="any" value={coords.lng} onChange={(e) => setCoords((c) => c ? { ...c, lng: Number(e.target.value) } : c)} className={inputCls} />
                </Field>
              </div>
            </section>
          )}
        </VenueSection>

        <PricingSection
          entry={form.entry} onEntryChange={(v) => setField('entry', v)}
          performerPay={form.performerPay} onPerformerPayChange={(v) => setField('performerPay', v)}
          bringerRequired={form.bringerRequired} onBringerRequiredChange={(v) => setField('bringerRequired', v)}
          bringerCount={form.bringerCount} onBringerCountChange={(v) => setField('bringerCount', v)}
          bringerNote={form.bringerNote} onBringerNoteChange={(v) => setField('bringerNote', v)}
        />

        <BookingSection
          audienceBooking={form.audienceBooking} onAudienceBookingChange={(v) => setField('audienceBooking', v)}
          performerBooking={form.performerBooking} onPerformerBookingChange={(v) => setField('performerBooking', v)}
        />

        <SocialsSection
          website={form.website} onWebsiteChange={(v) => setField('website', v)}
          instagram={form.instagram} onInstagramChange={(v) => setField('instagram', v)}
          facebook={form.facebook} onFacebookChange={(v) => setField('facebook', v)}
        />

        {errorMsg && <p className="text-sm text-red-500">{errorMsg}</p>}

        {isPending ? (
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => void handleApprove()}
              disabled={busy}
              className="flex-1 py-3 rounded-xl bg-emerald-500 text-white font-semibold text-sm hover:bg-emerald-600 transition-colors disabled:opacity-50"
            >
              {actionState === 'approving' ? 'Approving…' : 'Approve & publish'}
            </button>
            <button
              onClick={() => void handleReject()}
              disabled={busy}
              className="flex-1 py-3 rounded-xl bg-red-500 text-white font-semibold text-sm hover:bg-red-600 transition-colors disabled:opacity-50"
            >
              {actionState === 'rejecting' ? 'Rejecting…' : 'Reject'}
            </button>
          </div>
        ) : (
          <div className="rounded-xl bg-gray-50 dark:bg-zinc-900 ring-1 ring-gray-200 dark:ring-zinc-800 p-4 text-center">
            <p className="text-sm text-gray-400 dark:text-zinc-500">
              This submission has already been <strong className="text-gray-600 dark:text-zinc-300">{sub.status}</strong>.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}

export default function AdminSubmissionReview() {
  return (
    <RequireAdmin>
      <AdminSubmissionReviewInner />
    </RequireAdmin>
  )
}
