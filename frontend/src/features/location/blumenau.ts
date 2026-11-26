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

export const blumenauMapBounds = extent

function orientRing(ring: number[][], counterclockwise: boolean) {
  let area = 0
  for (let i = 1; i < ring.length; i++) {
    area += ring[i - 1][0] * ring[i][1] - ring[i][0] * ring[i - 1][1]
  }
  return (area > 0) === counterclockwise ? ring : [...ring].reverse()
}

const [west, south, east, north] = extent
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
