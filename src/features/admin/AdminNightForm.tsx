import { useState, useEffect, useRef } from 'react'
import type { ComedyNight, NightType, Level, NightStatus } from '../../types/comedyNight'
import { upsertNight } from '../../services/nightsService'
import { geocodeVenue } from '../../utils/geocode'
import {
  AboutSection,
  ScheduleSection,
  VenueSection,
  PricingSection,
  BookingSection,
  SocialsSection,
  Field,
  inputCls,
  selectCls,
  sectionCls,
  sectionHeadingCls,
} from '../../components/NightFormFields'

interface AdminNightFormProps {
  initial: ComedyNight
  onSaved: (night: ComedyNight) => void
}

type FormState = 'idle' | 'saving' | 'error'
type GeoState = 'idle' | 'loading' | 'found' | 'not-found'

export default function AdminNightForm({ initial, onSaved }: AdminNightFormProps) {
  const [night, setNight] = useState<ComedyNight>(initial)
  const [formState, setFormState] = useState<FormState>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [geoState, setGeoState] = useState<GeoState>('idle')
  const isFirstRender = useRef(true)

  function set<K extends keyof ComedyNight>(key: K, value: ComedyNight[K]) {
    setNight((prev) => ({ ...prev, [key]: value }))
  }

  // Auto-geocode when address or venue name changes (skip on initial load)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    if (!night.venue.address || night.venue.address.length < 5) return
    setGeoState('loading')
    const timer = setTimeout(async () => {
      const coords = await geocodeVenue(night.venue.name, night.venue.address)
      if (coords) {
        setNight((prev) => ({ ...prev, venue: { ...prev.venue, location: coords } }))
        setGeoState('found')
      } else {
        setGeoState('not-found')
      }
    }, 800)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [night.venue.address, night.venue.name])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormState('saving')
    try {
      await upsertNight(night)
      setFormState('idle')
      setErrorMsg('')
      onSaved(night)
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Save failed')
      setFormState('error')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <AboutSection
        name={night.name} onNameChange={(v) => set('name', v)}
        description={night.description} onDescriptionChange={(v) => set('description', v)}
        type={night.type as NightType} onTypeChange={(v) => set('type', v)}
        levels={night.levels as Level[]} onLevelsChange={(v) => set('levels', v)}
      />

      <ScheduleSection
        schedules={night.schedules}
        onSchedulesChange={(v) => set('schedules', v)}
      />

      <VenueSection
        venueName={night.venue.name} onVenueNameChange={(v) => set('venue', { ...night.venue, name: v })}
        venueAddress={night.venue.address} onVenueAddressChange={(v) => set('venue', { ...night.venue, address: v })}
        venueArea={night.venue.area} onVenueAreaChange={(v) => set('venue', { ...night.venue, area: v })}
        venueNearestStation={night.venue.nearestStation} onVenueNearestStationChange={(v) => set('venue', { ...night.venue, nearestStation: v })}
      >
        <div className="grid grid-cols-2 gap-4">
          <Field label="Latitude">
            <input type="number" step="any" value={night.venue.location.lat} onChange={(e) => set('venue', { ...night.venue, location: { ...night.venue.location, lat: Number(e.target.value) } })} className={inputCls} />
          </Field>
          <Field label="Longitude">
            <input type="number" step="any" value={night.venue.location.lng} onChange={(e) => set('venue', { ...night.venue, location: { ...night.venue.location, lng: Number(e.target.value) } })} className={inputCls} />
          </Field>
        </div>
        <p className="text-xs">
          {geoState === 'loading' && <span className="text-gray-400 dark:text-zinc-500">Updating coordinates…</span>}
          {geoState === 'found' && <span className="text-emerald-500">Coordinates updated from address</span>}
          {geoState === 'not-found' && <span className="text-amber-500">Address not found — enter coordinates manually</span>}
          {geoState === 'idle' && night.venue.location.lat === 0 && night.venue.location.lng === 0 && (
            <span className="text-amber-500">Coordinates are 0,0 — night won't appear on map</span>
          )}
        </p>
      </VenueSection>

      <PricingSection
        bringerRequired={night.bringer.required} onBringerRequiredChange={(v) => set('bringer', { ...night.bringer, required: v })}
        bringerCount={night.bringer.count} onBringerCountChange={(v) => set('bringer', { ...night.bringer, count: v })}
        bringerNote={night.bringer.note} onBringerNoteChange={(v) => set('bringer', { ...night.bringer, note: v })}
      />

      <BookingSection
        contact={night.howToBook.contact} onContactChange={(v) => set('howToBook', { contact: v ?? '' })}
      />

      <SocialsSection
        website={night.socials.website} onWebsiteChange={(v) => set('socials', { ...night.socials, website: v })}
        instagram={night.socials.instagram} onInstagramChange={(v) => set('socials', { ...night.socials, instagram: v })}
        facebook={night.socials.facebook} onFacebookChange={(v) => set('socials', { ...night.socials, facebook: v })}
      >
        <Field label="Facebook group">
          <input type="url" value={night.socials.facebookGroup ?? ''} onChange={(e) => set('socials', { ...night.socials, facebookGroup: e.target.value || undefined })} placeholder="https://facebook.com/groups/…" className={inputCls} />
        </Field>
        <Field label="TikTok">
          <input type="url" value={night.socials.tiktok ?? ''} onChange={(e) => set('socials', { ...night.socials, tiktok: e.target.value || undefined })} placeholder="https://tiktok.com/@…" className={inputCls} />
        </Field>
        <Field label="YouTube">
          <input type="url" value={night.socials.youtube ?? ''} onChange={(e) => set('socials', { ...night.socials, youtube: e.target.value || undefined })} placeholder="https://youtube.com/…" className={inputCls} />
        </Field>
      </SocialsSection>

      {/* Admin-only fields */}
      <section className={sectionCls}>
        <h2 className={sectionHeadingCls}>Admin</h2>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Status" required>
            <select value={night.status} onChange={(e) => set('status', e.target.value as NightStatus)} className={selectCls}>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="gone">Gone</option>
            </select>
          </Field>
          <Field label="Last verified">
            <input type="date" value={night.lastVerified} onChange={(e) => set('lastVerified', e.target.value)} className={inputCls} />
          </Field>
        </div>
        <Field label="Night ID">
          <input type="text" value={night.id} readOnly className={`${inputCls} opacity-60 cursor-not-allowed`} />
        </Field>
      </section>

      {formState === 'error' && (
        <p className="text-sm text-red-500">{errorMsg}</p>
      )}

      <button
        type="submit"
        disabled={formState === 'saving'}
        className="w-full py-3 rounded-xl bg-amber-500 text-white font-semibold text-sm hover:bg-amber-600 transition-colors disabled:opacity-50"
      >
        {formState === 'saving' ? 'Saving…' : 'Save changes'}
      </button>
    </form>
  )
}
