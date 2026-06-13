import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import { useNights } from '../../hooks/useNights'
import type { ComedyNight, NightType } from '../../types/comedyNight'
import { formatSchedule } from '../../utils/formatSchedule'
import Header from '../../components/Header'

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

interface BottomCardProps {
  night: ComedyNight
  onClose: () => void
}

function BottomCard({ night, onClose }: BottomCardProps) {
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
      <div className="flex items-center justify-end">
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
      <Header />

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
