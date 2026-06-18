import { parseBoroughFromNominatim, normalizeToBorough } from './londonBoroughs'
import type { LondonBorough } from './londonBoroughs'

export interface GeoResult {
  lat: number
  lng: number
  area: LondonBorough | null
}

interface NominatimResult {
  lat: string
  lon: string
  address?: {
    borough?: string
    suburb?: string
    neighbourhood?: string
  }
}

async function nominatimSearch(q: string): Promise<GeoResult | null> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&addressdetails=1&q=${encodeURIComponent(q)}`
  try {
    const res = await fetch(url, { headers: { 'Accept-Language': 'en' } })
    if (!res.ok) return null
    const results = (await res.json()) as NominatimResult[]
    if (!results.length) return null
    const r = results[0]
    const lat = parseFloat(r.lat)
    const lng = parseFloat(r.lon)
    const area = extractBorough(r.address)
    return { lat, lng, area }
  } catch {
    return null
  }
}

function extractBorough(address: NominatimResult['address']): LondonBorough | null {
  if (!address) return null
  if (address.borough) {
    const b = parseBoroughFromNominatim(address.borough)
    if (b) return b
  }
  // Fall back to suburb / neighbourhood → mapping table
  const fallback = address.suburb ?? address.neighbourhood
  if (fallback) return normalizeToBorough(fallback)
  return null
}

function extractUkPostcode(address: string): string | null {
  const match = address.match(/[A-Z]{1,2}\d{1,2}[A-Z]?\s*\d[A-Z]{2}/i)
  return match ? match[0].trim() : null
}

export function isLondonCoord(lat: number, lng: number): boolean {
  return lat > 51.28 && lat < 51.7 && lng > -0.51 && lng < 0.33
}

export async function geocodeVenue(
  name: string,
  address: string,
): Promise<GeoResult | null> {
  // 1. Full address
  const r1 = await nominatimSearch(address)
  if (r1) return r1
  // 2. Strip unit/floor prefix (e.g. "1/2 The Mall" → "The Mall, London E15 1XA")
  const stripped = address.replace(/^\S*\s+/, '')
  if (stripped !== address) {
    const r2 = await nominatimSearch(stripped)
    if (r2) return r2
  }
  // 3. Postcode only
  const postcode = extractUkPostcode(address)
  if (postcode) {
    const r3 = await nominatimSearch(postcode)
    if (r3) return r3
  }
  // 4. Venue name + postcode
  if (postcode && name) {
    const r4 = await nominatimSearch(`${name} ${postcode}`)
    if (r4) return r4
  }
  return null
}
