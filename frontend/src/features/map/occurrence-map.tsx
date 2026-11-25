import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import type { Bbox, Occurrence } from '@/features/occurrences/types'
import { MapPlaceholder } from './map-placeholder'

type Coordinates = { latitude: number; longitude: number }

type Props = {
  occurrences: Occurrence[]
  selectedId: string | null
  onSelect: (id: string) => void
  onBoundsChange: (bbox: Bbox) => void
  center?: Coordinates
  point?: Coordinates
  onPick?: (point: Coordinates) => void
  active?: boolean
}

export function OccurrenceMap({ occurrences, selectedId, onSelect, onBoundsChange, center, point, onPick, active = true }: Props) {
  const container = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const markers = useRef(new Map<string, mapboxgl.Marker>())
  const [error, setError] = useState(false)
  const [ready, setReady] = useState(false)
  const token = import.meta.env.VITE_MAPBOX_TOKEN

  useEffect(() => {
    if (!token || !container.current) return
    let dispose: (() => void) | undefined
    const frame = requestAnimationFrame(() => { dispose = createMap() })
    return () => {
      cancelAnimationFrame(frame)
      dispose?.()
    }

    function createMap() {
      if (!container.current) return
      let instance: mapboxgl.Map
      try {
        instance = new mapboxgl.Map({
          container: container.current, accessToken: token,
          style: 'mapbox://styles/mapbox/standard',
          config: { basemap: {
            theme: 'monochrome', lightPreset: 'day', show3dObjects: false,
            showPointOfInterestLabels: false, showTransitLabels: false,
          } },
          projection: 'mercator', center: [-49.0661, -26.9194],
          zoom: 12.5, minZoom: 8, renderWorldCopies: false, pitchWithRotate: false, dragRotate: false,
          locale: {
            'NavigationControl.ZoomIn': 'Aproximar',
            'NavigationControl.ZoomOut': 'Afastar',
            'GeolocateControl.FindMyLocation': 'Minha localização',
            'GeolocateControl.LocationNotAvailable': 'Localização indisponível',
            'AttributionControl.ToggleAttribution': 'Créditos do mapa',
          },
        })
      } catch {
        setError(true)
        return
      }
      map.current = instance
      instance.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right')
      instance.addControl(new mapboxgl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true }, trackUserLocation: false,
      }), 'top-right')
      const syncBounds = () => {
        const bounds = instance.getBounds()
        if (bounds) onBoundsChange([
          Math.max(-180, bounds.getWest()), Math.max(-90, bounds.getSouth()),
          Math.min(180, bounds.getEast()), Math.min(90, bounds.getNorth()),
        ])
      }
      let loaded = false
      instance.on('load', () => { loaded = true; setReady(true); setError(false); syncBounds() })
      instance.on('moveend', () => { if (loaded) syncBounds() })
      instance.on('error', () => { if (!loaded) setError(true) })
      const activeMarkers = markers.current
      return () => {
        activeMarkers.forEach(marker => marker.remove())
        activeMarkers.clear()
        instance.remove()
        map.current = null
      }
    }
  }, [token, onBoundsChange])

  useEffect(() => {
    if (active && ready) map.current?.resize()
  }, [active, ready])

  useEffect(() => {
    if (!ready || !center || !map.current) return
    const options = { center: [center.longitude, center.latitude] as [number, number], zoom: 13.8 }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) map.current.jumpTo(options)
    else map.current.easeTo({ ...options, duration: 350 })
  }, [center, ready])

  useEffect(() => {
    const instance = map.current
    if (!ready || !instance || !onPick) return
    const pick = ({ lngLat }: mapboxgl.MapMouseEvent) => onPick({ longitude: lngLat.lng, latitude: lngLat.lat })
    instance.on('click', pick)
    return () => { instance.off('click', pick) }
  }, [onPick, ready])

  useEffect(() => {
    if (!ready || !map.current || !point) return
    const pin = new mapboxgl.Marker({ color: '#2356a3' }).setLngLat([point.longitude, point.latitude]).addTo(map.current)
    return () => { pin.remove() }
  }, [point, ready])

  useEffect(() => {
    const instance = map.current
    if (!instance || !ready) return
    const visibleIds = new Set(occurrences.map(occurrence => occurrence.id))
    for (const [id, marker] of markers.current) {
      if (!visibleIds.has(id)) {
        marker.remove()
        markers.current.delete(id)
      }
    }
    for (const occurrence of occurrences) {
      let marker = markers.current.get(occurrence.id)
      if (!marker) {
        const button = document.createElement('button')
        button.type = 'button'
        const glyph = document.createElement('span')
        glyph.className = 'incident-glyph'
        glyph.setAttribute('aria-hidden', 'true')
        button.append(glyph)
        button.addEventListener('click', () => onSelect(occurrence.id))
        marker = new mapboxgl.Marker({ element: button }).setLngLat([occurrence.longitude, occurrence.latitude]).addTo(instance)
        markers.current.set(occurrence.id, marker)
      }
      const element = marker.getElement()
      const selected = occurrence.id === selectedId
      element.classList.add('map-marker')
      element.dataset.incidentType = occurrence.occurrence_type.slug
      element.classList.toggle('map-marker-selected', selected)
      element.setAttribute('aria-label', `${occurrence.occurrence_type.label}: ${occurrence.description}`)
      element.setAttribute('aria-pressed', String(selected))
      const position = marker.getLngLat()
      if (position.lng !== occurrence.longitude || position.lat !== occurrence.latitude) {
        marker.setLngLat([occurrence.longitude, occurrence.latitude])
      }
    }
  }, [occurrences, selectedId, onSelect, ready])

  if (!token) return <MapPlaceholder />
  return <div className="map-canvas-wrap">
    {!ready && <MapPlaceholder loading={!error} />}
    <div ref={container} className={ready ? 'map-canvas' : 'map-canvas map-canvas-loading'}
      aria-label="Mapa de ocorrências urbanas" />
    {error && <div className="map-error" role="alert">Não foi possível carregar o mapa. Consulte a lista ou recarregue a página.</div>}
  </div>
}
