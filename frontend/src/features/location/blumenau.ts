// GEO Blumenau, municipal boundary and neighborhoods, WGS84.
// https://geo.blumenau.sc.gov.br/server/rest/services/Limites
import municipalBoundary from './blumenau-boundary.json'
import neighborhoods from './blumenau-neighborhoods.json'

export type Place = { name: string; latitude: number; longitude: number }
type Coordinates = Omit<Place, 'name'>

const extent = municipalBoundary.reduce<[number, number, number, number]>((bounds, [ring]) => {
  for (const [x, y] of ring) {
    bounds[0] = Math.min(bounds[0], x)
    bounds[1] = Math.min(bounds[1], y)
    bounds[2] = Math.max(bounds[2], x)
    bounds[3] = Math.max(bounds[3], y)
  }
  return bounds
}, [Infinity, Infinity, -Infinity, -Infinity])

const [west, south, east, north] = extent
export const blumenauExtent: [number, number, number, number] = extent
export const blumenauMapBounds: [number, number, number, number] = [
  west - 0.28,
  south - 0.20,
  east + 0.28,
  north + 0.20,
]

function orientRing(ring: number[][], counterclockwise: boolean) {
  let area = 0
  for (let i = 1; i < ring.length; i++) {
    area += ring[i - 1][0] * ring[i][1] - ring[i][0] * ring[i - 1][1]
  }
  return (area > 0) === counterclockwise ? ring : [...ring].reverse()
}

const frame = [[west - 1, south - 1], [east + 1, south - 1], [east + 1, north + 1], [west - 1, north + 1], [west - 1, south - 1]]
export const outsideBlumenau = {
  type: 'Feature' as const,
  properties: {},
  geometry: {
    type: 'MultiPolygon' as const,
    coordinates: [
      [frame, ...municipalBoundary.map(([outer]) => orientRing(outer, false))],
      ...municipalBoundary.flatMap(([, ...holes]) => holes.map(hole => [orientRing(hole, true)])),
    ],
  },
}

export const blumenauNeighborhoodLabels = {
  type: 'FeatureCollection' as const,
  features: neighborhoods.map(({ name, longitude, latitude }) => ({
    type: 'Feature' as const,
    properties: { name },
    geometry: { type: 'Point' as const, coordinates: [longitude, latitude] },
  })),
}

function locateInRing({ longitude: x, latitude: y }: Coordinates, ring: number[][]) {
  let inside = false
  for (let i = 1; i < ring.length; i++) {
    const [ax, ay] = ring[i - 1]
    const [bx, by] = ring[i]
    if (x >= Math.min(ax, bx) && x <= Math.max(ax, bx) && y >= Math.min(ay, by) && y <= Math.max(ay, by) &&
      Math.abs((x - ax) * (by - ay) - (y - ay) * (bx - ax)) < 1e-13) return 'edge'
    if ((ay > y) !== (by > y) && x < ax + (bx - ax) * (y - ay) / (by - ay)) inside = !inside
  }
  return inside ? 'inside' : 'outside'
}

export function isInBlumenau(point: Coordinates) {
  return municipalBoundary.some(([outer, ...holes]) =>
    locateInRing(point, outer) !== 'outside' && !holes.some(hole => locateInRing(point, hole) === 'inside'))
}

const normalize = (value: string) => value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
const streetExamples: Record<string, string> = {
  Centro: 'Rua XV de Novembro', 'Victor Konder': 'Rua São Paulo', 'Itoupava Seca': 'Rua Antônio da Veiga',
}

export function matchPlaces(query: string, includeStreetExamples = false) {
  const term = normalize(query.trim())
  if (!term) return []
  return neighborhoods.filter(place => normalize(place.name).includes(term) ||
    (includeStreetExamples && normalize(streetExamples[place.name] ?? '').includes(term)))
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
}

type GeocodeFeature = {
  geometry?: { coordinates?: [number, number] }
  properties?: {
    name?: string
    full_address?: string
    place_formatted?: string
    context?: {
      neighborhood?: { name?: string }
      street?: { name?: string }
    }
  }
}

function formatGeocodeLabel(feature: GeocodeFeature): string {
  const props = feature.properties
  if (!props) return 'Blumenau'
  const main = props.name?.trim()
  const neighborhood = props.context?.neighborhood?.name?.trim()
  if (main && neighborhood && !normalize(main).includes(normalize(neighborhood))) {
    return `${main}, ${neighborhood}`
  }
  if (main) return main
  if (props.full_address) return props.full_address.replace(/,\s*Blumenau.*$/i, '').trim()
  return 'Blumenau'
}

export async function searchAddresses(query: string, signal?: AbortSignal): Promise<Place[]> {
  const trimmed = query.trim()
  const token = import.meta.env.VITE_MAPBOX_TOKEN
  if (!token || trimmed.length < 3) return []
  const params = new URLSearchParams({
    q: trimmed,
    access_token: token,
    country: 'br',
    language: 'pt',
    bbox: blumenauExtent.join(','),
    proximity: '-49.0661,-26.9194',
    types: 'address,street,neighborhood,locality,poi',
    limit: '6',
    autocomplete: 'true',
  })
  const response = await fetch(`https://api.mapbox.com/search/geocode/v6/forward?${params}`, { signal })
  if (!response.ok) return []
  const data = await response.json() as { features?: GeocodeFeature[] }
  const seen = new Set<string>()
  const places: Place[] = []
  for (const feature of data.features ?? []) {
    const coords = feature.geometry?.coordinates
    if (!coords || coords.length < 2) continue
    const point = { longitude: coords[0], latitude: coords[1] }
    if (!isInBlumenau(point)) continue
    const name = formatGeocodeLabel(feature)
    const key = normalize(name)
    if (seen.has(key)) continue
    seen.add(key)
    places.push({ name, ...point })
  }
  return places
}

export async function reverseGeocode(point: Coordinates, signal?: AbortSignal): Promise<string | null> {
  const token = import.meta.env.VITE_MAPBOX_TOKEN
  if (!token) return null
  const params = new URLSearchParams({
    longitude: String(point.longitude),
    latitude: String(point.latitude),
    access_token: token,
    language: 'pt',
    types: 'address,street,neighborhood',
    limit: '1',
  })
  try {
    const response = await fetch(`https://api.mapbox.com/search/geocode/v6/reverse?${params}`, { signal })
    if (!response.ok) return null
    const data = await response.json() as { features?: GeocodeFeature[] }
    const first = data.features?.[0]
    return first ? formatGeocodeLabel(first) : null
  } catch {
    return null
  }
}
