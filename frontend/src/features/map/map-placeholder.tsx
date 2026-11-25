import { MapPinned } from 'lucide-react'

export function MapPlaceholder({ loading = false }: { loading?: boolean }) {
  return <div className="map-placeholder">
    <div className="map-caption">
      <MapPinned size={16} aria-hidden="true" />
      {loading ? 'Abrindo o mapa…' : 'Mapa ilustrativo'}
    </div>
  </div>
}
