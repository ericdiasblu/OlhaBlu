import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import type { Bbox, Occurrence } from '@/features/occurrences/types'
import { MapPlaceholder } from './map-placeholder'

type Props = {
  occurrences: Occurrence[]
  selectedId: string | null
  onSelect: (id: string) => void
  onBoundsChange: (bbox: Bbox) => void
}

export function OccurrenceMap({ occurrences, selectedId, onSelect, onBoundsChange }: Props) {
  const container = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const markers = useRef<mapboxgl.Marker[]>([])
  const [error, setError] = useState(false)
  const [ready, setReady] = useState(false)
  const token = import.meta.env.VITE_MAPBOX_TOKEN

  useEffect(() => {
    if (!token || !container.current) return
    let instance: mapboxgl.Map
    try {
      instance = new mapboxgl.Map({
        container: container.current, accessToken: token,
        style: 'mapbox://styles/mapbox/light-v11', center: [-49.0661, -26.9194],
        zoom: 12.5, minZoom: 8, renderWorldCopies: false,
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
    instance.on('load', () => { setReady(true); setError(false); syncBounds() })
    instance.on('moveend', syncBounds)
    instance.on('error', () => setError(true))
    return () => {
      markers.current.forEach(marker => marker.remove())
      markers.current = []
      instance.remove()
      map.current = null
    }
  }, [token, onBoundsChange])

  useEffect(() => {
    markers.current.forEach(marker => marker.remove())
    markers.current = []
    if (!map.current || !ready) return
    markers.current = occurrences.map(occurrence => {
      const element = document.createElement('button')
      element.type = 'button'
      element.className = `map-marker ${occurrence.id === selectedId ? 'map-marker-selected' : ''}`
      element.textContent = '!'
      element.setAttribute('aria-label', `${occurrence.occurrence_type.label}: ${occurrence.description}`)
      element.addEventListener('click', () => onSelect(occurrence.id))
      return new mapboxgl.Marker({ element })
        .setLngLat([occurrence.longitude, occurrence.latitude]).addTo(map.current!)
    })
    return () => { markers.current.forEach(marker => marker.remove()); markers.current = [] }
  }, [occurrences, selectedId, onSelect, ready])

  if (!token) return <MapPlaceholder />
  return <div className="map-canvas-wrap">
    <div ref={container} className="map-canvas" aria-label="Mapa de ocorrências urbanas" />
    {error && <div className="map-error" role="alert">Não foi possível carregar o mapa. Consulte a lista ou recarregue a página.</div>}
  </div>
}
