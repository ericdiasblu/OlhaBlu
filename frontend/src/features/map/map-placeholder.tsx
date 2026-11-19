import { MapPinned } from 'lucide-react'

export function MapPlaceholder({ loading = false }: { loading?: boolean }) {
  return <div className="map-placeholder">
    <div className="map-placeholder-card">
      <div className="placeholder-icon"><MapPinned size={30} strokeWidth={1.5} /></div>
      <span className="eyebrow">BLUMENAU · SANTA CATARINA</span>
      <h2>{loading ? 'Abrindo o mapa' : 'Um olhar sobre a cidade'}</h2>
      <p>{loading ? 'Preparando a visualização da região.' : 'O mapa ainda não está disponível. A consulta de ocorrências pela lista continua acessível.'}</p>
      {!loading && import.meta.env.DEV && <p className="map-dev-note">
        Para desenvolvimento: preencha VITE_MAPBOX_TOKEN em frontend/.env e reinicie o Vite.
      </p>}
    </div>
  </div>
}
