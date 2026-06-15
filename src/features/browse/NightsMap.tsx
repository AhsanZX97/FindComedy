import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { MapContainer, TileLayer, CircleMarker, useMap, useMapEvents } from 'react-leaflet'
import type { Map as LeafletMap } from 'leaflet'
import type { ComedyNight, NightType } from '../../types/comedyNight'
import { formatSchedule } from '../../utils/formatSchedule'
import { nightSlug } from '../../utils/slug'
import { useTheme } from '../../context/ThemeContext'
import CalendarIcon from '../../components/CalendarIcon'

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

function PanToSelected({ night }: { night: ComedyNight | null }) {
  const map = useMap()
  useEffect(() => {
    if (!night) return
    map.panTo([night.venue.location.lat, night.venue.location.lng])
  }, [map, night])
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

  useEffect(() => { update() }, [night]) // eslint-disable-line react-hooks/exhaustive-deps

  return null
}

interface MarkerPopupProps {
  night: ComedyNight
  pos: { x: number; y: number }
  onClose: () => void
  isDark: boolean
}

function MarkerPopup({ night, pos, onClose, isDark }: MarkerPopupProps) {
  const schedule = formatSchedule(night)

  const arrowBorderColor = isDark ? '#3f3f46' : '#e5e7eb'
  const arrowFillColor = isDark ? '#18181b' : 'white'

  return (
    <div
      className="absolute z-[1002] pointer-events-auto"
      style={{
        left: pos.x,
        top: pos.y,
        transform: 'translate(-50%, calc(-100% - 14px))',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Card */}
      <div className="w-56 bg-white dark:bg-zinc-900 ring-1 ring-gray-200 dark:ring-zinc-700 rounded-xl shadow-lg flex flex-col gap-2 p-3">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <span
            className="text-xs font-medium px-2 py-0.5 rounded-full shrink-0"
            style={{
              background: `${TYPE_COLORS[night.type]}18`,
              color: TYPE_COLORS[night.type],
              border: `1px solid ${TYPE_COLORS[night.type]}44`,
            }}
          >
            {TYPE_LABELS[night.type]}
          </span>
          <button
            onClick={onClose}
            aria-label="Close popup"
            className="text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200 text-lg leading-none shrink-0 -mt-0.5 transition-colors"
          >
            ×
          </button>
        </div>

        {/* Name — readable ink, matching the listing cards */}
        <p className="text-sm font-display font-bold text-gray-900 dark:text-zinc-50 leading-tight">{night.name}</p>

        {/* Schedule — the scarce amber "when", matching the listing cards */}
        {schedule && (
          <p className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
            <CalendarIcon className="h-3 w-3 shrink-0" />
            <span>{schedule}</span>
          </p>
        )}

        {/* Venue */}
        <p className="text-xs text-gray-500 dark:text-zinc-400 leading-snug">{night.venue.name} · {night.venue.area}</p>

        {/* CTA */}
        <Link
          to={`/night/${nightSlug(night)}`}
          className="mt-0.5 block text-center text-xs font-semibold py-1.5 rounded-lg bg-amber-500 text-zinc-950 hover:bg-amber-400 transition-colors"
        >
          View full night →
        </Link>
      </div>

      {/* Downward arrow — border layer */}
      <div
        className="absolute left-1/2 -translate-x-1/2 bottom-0 translate-y-full"
        style={{
          width: 0,
          height: 0,
          borderLeft: '8px solid transparent',
          borderRight: '8px solid transparent',
          borderTop: `9px solid ${arrowBorderColor}`,
        }}
      />
      {/* Downward arrow — fill layer */}
      <div
        className="absolute left-1/2 -translate-x-1/2 bottom-0"
        style={{
          width: 0,
          height: 0,
          transform: 'translateX(-50%) translateY(calc(100% - 1px))',
          borderLeft: '7px solid transparent',
          borderRight: '7px solid transparent',
          borderTop: `8px solid ${arrowFillColor}`,
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
  const { theme } = useTheme()
  const isDark = theme === 'dark'
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

  useEffect(() => {
    if (!selectedNight) setPopupPos(null)
  }, [selectedNight])

  const tileUrl = isDark
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'

  const tileAttribution = isDark
    ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
    : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'

  return (
    <div className="isolate h-full w-full relative">
      <MapContainer
        center={[51.505, -0.09]}
        zoom={12}
        style={{ height: '100%', width: '100%' }}
        attributionControl={false}
        ref={mapRef}
      >
        <TileLayer url={tileUrl} attribution={tileAttribution} />

        {validNights.map((night) => {
          const isSelected = night.id === selectedId
          return (
            <CircleMarker
              key={night.id}
              center={[night.venue.location.lat, night.venue.location.lng]}
              radius={isSelected ? 11 : 7}
              pathOptions={{
                fillColor: TYPE_COLORS[night.type],
                fillOpacity: isSelected ? 1 : 0.85,
                color: isSelected ? '#f59e0b' : (isDark ? '#18181b' : '#ffffff'),
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
        <PanToSelected night={selectedNight} />
        <InvalidateSize trigger={invalidateTrigger} />
      </MapContainer>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-[999] bg-white/95 dark:bg-zinc-900/95 backdrop-blur rounded-xl p-3 ring-1 ring-gray-200 dark:ring-zinc-800 shadow-sm flex flex-col gap-1.5 pointer-events-none">
        {(Object.keys(TYPE_COLORS) as NightType[]).map((type) => (
          <div key={type} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full shrink-0" style={{ background: TYPE_COLORS[type] }} />
            <span className="text-xs text-gray-600 dark:text-zinc-400">{TYPE_LABELS[type]}</span>
          </div>
        ))}
      </div>

      {/* Map popup */}
      {selectedNight && popupPos && (
        <MarkerPopup
          night={selectedNight}
          pos={popupPos}
          onClose={onDeselect}
          isDark={isDark}
        />
      )}
    </div>
  )
}
