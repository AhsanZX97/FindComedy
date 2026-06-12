import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { MapContainer, TileLayer, CircleMarker, useMap, useMapEvents } from 'react-leaflet'
import type { Map as LeafletMap } from 'leaflet'
import type { ComedyNight, NightType } from '../../types/comedyNight'
import { formatSchedule } from '../../utils/formatSchedule'

export const TYPE_COLORS: Record<NightType, string> = {
  'open-mic': '#3b82f6',
  showcase: '#8b5cf6',
  pro: '#f59e0b',
  mixed: '#71717a',
}

export const TYPE_LABELS: Record<NightType, string> = {
  'open-mic': 'Open Mic',
  showcase: 'Showcase',
  pro: 'Pro Night',
  mixed: 'Mixed Bill',
}

function isLondonCoord(lat: number, lng: number): boolean {
  return lat > 51.28 && lat < 51.7 && lng > -0.51 && lng < 0.33
}

function InvalidateSize({ trigger }: { trigger: unknown }) {
  const map = useMap()
  useEffect(() => { map.invalidateSize() }, [map, trigger])
  return null
}

interface PopupTrackerProps {
  night: ComedyNight | null
  onPositionChange: (pos: { x: number; y: number } | null) => void
  onMapClick: () => void
}

function PopupTracker({ night, onPositionChange, onMapClick }: PopupTrackerProps) {
  const map = useMapEvents({
    move: () => update(),
    zoom: () => update(),
    click: (e) => {
      // Marker clicks bubble to the map — ignore them here so selection isn't
      // immediately cleared by the map-level handler firing on the same click.
      const target = e.originalEvent.target as Element
      if (target.classList.contains('leaflet-interactive')) return
      onMapClick()
    },
  })

  function update() {
    if (!night) { onPositionChange(null); return }
    const pt = map.latLngToContainerPoint([night.venue.location.lat, night.venue.location.lng])
    onPositionChange({ x: pt.x, y: pt.y })
  }

  // Update whenever the selected night changes
  useEffect(() => { update() }, [night]) // eslint-disable-line react-hooks/exhaustive-deps

  return null
}

interface MarkerPopupProps {
  night: ComedyNight
  pos: { x: number; y: number }
  onClose: () => void
}

function MarkerPopup({ night, pos, onClose }: MarkerPopupProps) {
  const isFree = night.pricing.entry.toLowerCase() === 'free'
  const schedule = formatSchedule(night)

  return (
    <div
      className="absolute z-[1002] pointer-events-auto"
      style={{
        left: pos.x,
        top: pos.y,
        transform: 'translate(-50%, calc(-100% - 14px))',
      }}
      // Prevent clicks inside popup from bubbling to the map
      onClick={(e) => e.stopPropagation()}
    >
      {/* Card */}
      <div className="w-56 bg-zinc-900 ring-1 ring-zinc-700 rounded-xl shadow-xl flex flex-col gap-2 p-3">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <span
            className="text-xs font-medium px-2 py-0.5 rounded-full shrink-0"
            style={{
              background: `${TYPE_COLORS[night.type]}22`,
              color: TYPE_COLORS[night.type],
              border: `1px solid ${TYPE_COLORS[night.type]}44`,
            }}
          >
            {TYPE_LABELS[night.type]}
          </span>
          <button
            onClick={onClose}
            aria-label="Close popup"
            className="text-zinc-500 hover:text-zinc-200 text-lg leading-none shrink-0 -mt-0.5 transition-colors"
          >
            ×
          </button>
        </div>

        {/* Name */}
        <p className="text-sm font-display font-bold text-amber-400 leading-tight">{night.name}</p>

        {/* Venue */}
        <p className="text-xs text-zinc-400 leading-snug">{night.venue.name} · {night.venue.area}</p>

        {/* Schedule + price */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-zinc-300 font-medium">{schedule}</span>
          <span className={`text-xs font-semibold shrink-0 ${isFree ? 'text-emerald-400' : 'text-zinc-300'}`}>
            {isFree ? 'Free' : night.pricing.entry}
          </span>
        </div>

        {/* CTA */}
        <Link
          to={`/night/${night.id}`}
          className="mt-0.5 block text-center text-xs font-semibold py-1.5 rounded-lg bg-amber-500 text-zinc-950 hover:bg-amber-400 transition-colors"
        >
          View full night →
        </Link>
      </div>

      {/* Downward arrow */}
      <div
        className="absolute left-1/2 -translate-x-1/2 bottom-0 translate-y-full"
        style={{
          width: 0,
          height: 0,
          borderLeft: '7px solid transparent',
          borderRight: '7px solid transparent',
          borderTop: '8px solid #3f3f46', // zinc-700 to match ring
        }}
      />
    </div>
  )
}

interface NightsMapProps {
  nights: ComedyNight[]
  selectedId: string | null
  onSelect: (id: string) => void
  onDeselect: () => void
  invalidateTrigger?: unknown
}

export default function NightsMap({ nights, selectedId, onSelect, onDeselect, invalidateTrigger }: NightsMapProps) {
  const mapRef = useRef<LeafletMap | null>(null)
  const fittedRef = useRef(false)
  const [popupPos, setPopupPos] = useState<{ x: number; y: number } | null>(null)

  const validNights = nights.filter((n) =>
    isLondonCoord(n.venue.location.lat, n.venue.location.lng),
  )

  const selectedNight = validNights.find((n) => n.id === selectedId) ?? null

  useEffect(() => {
    const map = mapRef.current
    if (!map || fittedRef.current || validNights.length === 0) return
    fittedRef.current = true
    const lats = validNights.map((n) => n.venue.location.lat)
    const lngs = validNights.map((n) => n.venue.location.lng)
    map.fitBounds([
      [Math.min(...lats), Math.min(...lngs)],
      [Math.max(...lats), Math.max(...lngs)],
    ], { padding: [40, 40] })
  }, [validNights])

  // Clear popup position when night deselects
  useEffect(() => {
    if (!selectedNight) setPopupPos(null)
  }, [selectedNight])

  return (
    <div className="isolate h-full w-full relative">
      <MapContainer
        center={[51.505, -0.09]}
        zoom={12}
        style={{ height: '100%', width: '100%' }}
        attributionControl={false}
        ref={mapRef}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />

        {validNights.map((night) => {
          const isSelected = night.id === selectedId
          return (
            <CircleMarker
              key={night.id}
              center={[night.venue.location.lat, night.venue.location.lng]}
              radius={isSelected ? 11 : 7}
              pathOptions={{
                fillColor: TYPE_COLORS[night.type],
                fillOpacity: isSelected ? 1 : 0.75,
                color: isSelected ? '#fbbf24' : '#18181b',
                weight: isSelected ? 2.5 : 1.5,
              }}
              eventHandlers={{ click: () => onSelect(night.id) }}
            />
          )
        })}

        <PopupTracker
          night={selectedNight}
          onPositionChange={setPopupPos}
          onMapClick={onDeselect}
        />
        <InvalidateSize trigger={invalidateTrigger} />
      </MapContainer>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-[999] bg-zinc-900/95 backdrop-blur rounded-xl p-3 ring-1 ring-zinc-800 flex flex-col gap-1.5 pointer-events-none">
        {(Object.keys(TYPE_COLORS) as NightType[]).map((type) => (
          <div key={type} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full shrink-0" style={{ background: TYPE_COLORS[type] }} />
            <span className="text-xs text-zinc-400">{TYPE_LABELS[type]}</span>
          </div>
        ))}
      </div>

      {/* Map popup */}
      {selectedNight && popupPos && (
        <MarkerPopup
          night={selectedNight}
          pos={popupPos}
          onClose={onDeselect}
        />
      )}
    </div>
  )
}
