import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import type { Bbox, Occurrence } from '@/features/occurrences/types'
import { blumenauMapBounds, blumenauNeighborhoodLabels, isInBlumenau, outsideBlumenau } from '@/features/location/blumenau'
import { MapPlaceholder } from './map-placeholder'

type Coordinates = { latitude: number; longitude: number }
const municipalityMask = 'outside-blumenau'
const neighborhoodLabels = 'blumenau-neighborhoods'
const mapIsDark = () => document.documentElement.dataset.theme === 'dark'
const maskColor = () => mapIsDark() ? '#0d0d0e' : '#e6edf7'

function basemapConfig(dark: boolean) {
  return {
    theme: 'monochrome',
    lightPreset: 'day',
    show3dObjects: false,
    showPointOfInterestLabels: false,
    showPlaceLabels: false,
    showTransitLabels: false,
    ...(dark && {
      colorLand: '#101012',
      colorGreenspace: '#18181b',
      colorWater: '#232328',
      colorBuildings: '#262629',
      colorRoads: '#e4e4e4',
      colorMotorways: '#ffffff',
      colorTrunks: '#eeeeee',
      colorRoadLabels: '#eeeeee',
    }),
  }
}

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
          config: { basemap: basemapConfig(document.documentElement.dataset.theme === 'dark') },
          projection: 'mercator', center: [-49.0661, -26.9194],
          zoom: 11.8, minZoom: 9.5, maxBounds: blumenauMapBounds, renderWorldCopies: false, pitchWithRotate: false, dragRotate: false,
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
          Math.max(blumenauMapBounds[0], bounds.getWest()), Math.max(blumenauMapBounds[1], bounds.getSouth()),
          Math.min(blumenauMapBounds[2], bounds.getEast()), Math.min(blumenauMapBounds[3], bounds.getNorth()),
        ])
      }
      let loaded = false
      instance.on('load', () => {
        instance.addSource(municipalityMask, { type: 'geojson', data: outsideBlumenau })
        instance.addLayer({ id: municipalityMask, type: 'fill', source: municipalityMask, paint: { 'fill-color': maskColor(), 'fill-opacity': 0.78 } })
        instance.addSource(neighborhoodLabels, { type: 'geojson', data: blumenauNeighborhoodLabels })
        instance.addLayer({
          id: neighborhoodLabels, type: 'symbol', source: neighborhoodLabels,
          layout: { 'text-field': ['get', 'name'], 'text-size': 12, 'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'] },
          paint: {
            'text-color': mapIsDark() ? '#eeeeee' : '#4b5c73',
            'text-halo-color': mapIsDark() ? '#181819' : '#ffffff',
            'text-halo-width': 1.5,
          },
        })
        loaded = true
        setReady(true)
        setError(false)
        syncBounds()
      })
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
    const instance = map.current
    if (!ready || !instance) return
    const root = document.documentElement
    let appliedTheme: boolean | undefined
    const applyTheme = () => {
      const dark = mapIsDark()
      if (appliedTheme !== dark) {
        instance.setConfig('basemap', basemapConfig(dark))
        instance.setPaintProperty(municipalityMask, 'fill-color', maskColor())
        instance.setPaintProperty(neighborhoodLabels, 'text-color', dark ? '#eeeeee' : '#4b5c73')
        instance.setPaintProperty(neighborhoodLabels, 'text-halo-color', dark ? '#181819' : '#ffffff')
        appliedTheme = dark
      }
    }
    const observer = new MutationObserver(applyTheme)
    observer.observe(root, { attributes: true, attributeFilter: ['data-theme'] })
    applyTheme()
    return () => observer.disconnect()
  }, [ready])

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
    const element = document.createElement('div')
    element.className = 'map-location-marker'
    element.setAttribute('aria-hidden', 'true')
    const pin = new mapboxgl.Marker({ element }).setLngLat([point.longitude, point.latitude]).addTo(map.current)
    return () => { pin.remove() }
  }, [point, ready])

  useEffect(() => {
    const instance = map.current
    if (!instance || !ready) return
    const localOccurrences = occurrences.filter(isInBlumenau)
    const visibleIds = new Set(localOccurrences.map(occurrence => occurrence.id))
    for (const [id, marker] of markers.current) {
      if (!visibleIds.has(id)) {
        marker.remove()
        markers.current.delete(id)
      }
    }
    for (const occurrence of localOccurrences) {
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
