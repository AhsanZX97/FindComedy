import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import { useNights } from '../../hooks/useNights'
import type { ComedyNight, NightType } from '../../types/comedyNight'

// Load Leaflet CSS once
function useLeafletCss() {
  useEffect(() => {
    if (!document.head.querySelector('link[href*="leaflet"]')) {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      link.crossOrigin = ''
      document.head.appendChild(link)
    }
  }, [])
}

const TYPE_COLORS: Record<NightType, string> = {
  'open-mic': '#3b82f6',  // blue
  showcase: '#8b5cf6',    // violet
  pro: '#f59e0b',         // amber
  mixed: '#71717a',       // zinc
}

const TYPE_LABELS: Record<NightType, string> = {
  'open-mic': 'Open Mic',
  showcase: 'Showcase',
  pro: 'Pro Night',
  mixed: 'Mixed Bill',
}

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const FREQ_LABELS: Record<string, string> = {
  weekly: 'Every',
  biweekly: 'Every other',
  monthly: 'Monthly',
  irregular: '',
}

function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number)
  const suffix = h >= 12 ? 'pm' : 'am'
  const hour = h > 12 ? h - 12 : h === 0 ? 12 : h
  return m === 0 ? `${hour}${suffix}` : `${hour}:${m.toString().padStart(2, '0')}${suffix}`
}

function formatSchedule(night: ComedyNight): string {
  const freq = FREQ_LABELS[night.schedule.frequency]
  const day = WEEKDAY_LABELS[night.schedule.weekday]
  const time = formatTime(night.schedule.startTime)
  if (night.schedule.frequency === 'irregular') return time
  return `${freq} ${day} · ${time}`.trim()
}

interface BottomCardProps {
  night: ComedyNight
  onClose: () => void
}

function BottomCard({ night, onClose }: BottomCardProps) {
  const isFree = night.pricing.entry.toLowerCase() === 'free'
  return (
    <div className="fixed bottom-0 left-0 right-0 z-[1000] bg-zinc-900 border-t border-zinc-800 rounded-t-2xl p-5 flex flex-col gap-3 animate-[slideUp_150ms_ease-out]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex flex-wrap gap-1">
            <span
              className="text-xs font-medium px-2 py-0.5 rounded-full"
              style={{ background: `${TYPE_COLORS[night.type]}22`, color: TYPE_COLORS[night.type], border: `1px solid ${TYPE_COLORS[night.type]}44` }}
            >
              {TYPE_LABELS[night.type]}
            </span>
          </div>
          <h2 className="text-lg font-display font-bold text-amber-400 leading-tight">{night.name}</h2>
          <p className="text-sm text-zinc-400">{night.venue.name} · {night.venue.area}</p>
          <p className="text-sm text-white font-medium">{formatSchedule(night)}</p>
        </div>
        <button
          onClick={onClose}
          aria-label="Close"
          className="text-zinc-500 hover:text-zinc-300 text-xl shrink-0 leading-none mt-1"
        >
          ×
        </button>
      </div>
      <div className="flex items-center justify-between">
        <span className={`text-sm font-semibold ${isFree ? 'text-emerald-400' : 'text-zinc-300'}`}>
          {isFree ? 'Free entry' : night.pricing.entry}
        </span>
        <Link
          to={`/night/${night.id}`}
          className="px-4 py-1.5 rounded-lg bg-amber-500 text-zinc-950 text-sm font-semibold hover:bg-amber-400 transition-colors"
        >
          View night →
        </Link>
      </div>
    </div>
  )
}

function Legend() {
  return (
    <div className="absolute bottom-4 left-4 z-[999] bg-zinc-900/95 backdrop-blur rounded-xl p-3 ring-1 ring-zinc-800 flex flex-col gap-1.5">
      {(Object.keys(TYPE_COLORS) as NightType[]).map((type) => (
        <div key={type} className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full shrink-0" style={{ background: TYPE_COLORS[type] }} />
          <span className="text-xs text-zinc-400">{TYPE_LABELS[type]}</span>
        </div>
      ))}
    </div>
  )
}

export default function MapPage() {
  useLeafletCss()
  const nightsState = useNights()
  const [selected, setSelected] = useState<ComedyNight | null>(null)

  if (nightsState.status === 'loading') {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
      </div>
    )
  }

  if (nightsState.status === 'error') {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-zinc-400">{nightsState.message}</p>
        <Link to="/" className="text-amber-400 text-sm hover:underline">Back to browse</Link>
      </div>
    )
  }

  const nights = nightsState.data.filter((n) => n.status === 'active')

  return (
    <div className="h-screen w-full flex flex-col bg-zinc-950">
      {/* Header */}
      <header className="shrink-0 z-[1000] relative bg-zinc-950/90 backdrop-blur border-b border-zinc-800">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-4">
          <Link to="/" className="text-xl font-display font-bold text-amber-400 shrink-0">
            FindComedy
          </Link>
          <nav className="flex gap-3 ml-auto text-sm">
            <Link to="/" className="px-3 py-1 rounded-lg text-zinc-500 hover:text-zinc-300 transition-colors">
              Browse
            </Link>
            <Link to="/tonight" className="px-3 py-1 rounded-lg text-zinc-500 hover:text-zinc-300 transition-colors">
              Tonight
            </Link>
            <Link to="/map" className="px-3 py-1 rounded-lg text-amber-400 transition-colors">
              Map
            </Link>
          </nav>
        </div>
      </header>

      {/* Map fills remaining space */}
      <div className="flex-1 relative">
        <MapContainer
          center={[51.505, -0.09]}
          zoom={12}
          style={{ height: '100%', width: '100%' }}
          attributionControl={false}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          {nights.map((night) => (
            <CircleMarker
              key={night.id}
              center={[night.venue.location.lat, night.venue.location.lng]}
              radius={8}
              pathOptions={{
                fillColor: TYPE_COLORS[night.type],
                fillOpacity: 0.9,
                color: '#18181b',
                weight: 2,
              }}
              eventHandlers={{
                click: () => setSelected(night),
              }}
            >
              <Popup>{night.name}</Popup>
            </CircleMarker>
          ))}
        </MapContainer>

        <Legend />
      </div>

      {selected && <BottomCard night={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
