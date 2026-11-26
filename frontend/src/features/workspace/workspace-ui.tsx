import { useEffect, useState, type ReactNode } from 'react'
import { MapPin, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { matchPlaces, searchAddresses, type Place } from '@/features/location/blumenau'

export function WorkspaceHeading({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return <div className="workspace-heading">
    <div><h1 id="workspace-title" tabIndex={-1}>{title}</h1><p>{description}</p></div>
    {action}
  </div>
}

export function WorkspaceEmpty({ icon, title, description, action }: { icon: ReactNode; title: string; description: string; action?: ReactNode }) {
  return <div className="workspace-empty">
    <span className="workspace-icon">{icon}</span>
    <h2>{title}</h2><p>{description}</p>{action}
  </div>
}

export function PlacePicker({ id, query, onQuery, onChoose, selected }: {
  id: string; query: string; onQuery: (value: string) => void; onChoose: (place: Place) => void; selected?: Place
}) {
  const localMatches = matchPlaces(query)
  const [remoteMatches, setRemoteMatches] = useState<Place[]>([])
  const [searching, setSearching] = useState(false)
  const hasMapbox = Boolean(import.meta.env.VITE_MAPBOX_TOKEN)

  useEffect(() => {
    const trimmed = query.trim()
    if (!hasMapbox || trimmed.length < 3) {
      setRemoteMatches([])
      setSearching(false)
      return
    }
    const controller = new AbortController()
    setSearching(true)
    const timer = window.setTimeout(() => {
      void searchAddresses(trimmed, controller.signal)
        .then(results => {
          if (!controller.signal.aborted) setRemoteMatches(results)
        })
        .catch(() => {
          if (!controller.signal.aborted) setRemoteMatches([])
        })
        .finally(() => {
          if (!controller.signal.aborted) setSearching(false)
        })
    }, 300)
    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [query, hasMapbox])

  const seen = new Set(localMatches.map(place => place.name.toLowerCase()))
  const matches = [
    ...localMatches,
    ...remoteMatches.filter(place => !seen.has(place.name.toLowerCase())),
  ]

  return <div className="place-picker">
    <label htmlFor={id}>{hasMapbox ? 'Buscar rua, endereço ou bairro' : 'Buscar bairro'}</label>
    <div className="place-input"><Search size={17} aria-hidden="true" /><input id={id} type="search" value={query}
      onChange={event => onQuery(event.target.value)} placeholder={hasMapbox ? 'Ex. Rua XV de Novembro, Centro' : 'Ex. Centro'} autoComplete="off" maxLength={120} /></div>
    <p className="field-hint">
      {hasMapbox
        ? 'Digite o nome de uma rua, endereço ou bairro em Blumenau.'
        : 'Digite o nome de um dos 35 bairros de Blumenau. A seleção marca um ponto de referência no bairro.'}
    </p>
    {matches.length > 0 && <div className="place-list" aria-label="Locais encontrados">
      {matches.map(place => <Button key={`${place.name}-${place.latitude}-${place.longitude}`} type="button" variant="ghost"
        aria-pressed={selected?.name === place.name} onClick={() => onChoose(place)}>
        <MapPin aria-hidden="true" /> {place.name}
      </Button>)}
    </div>}
    {searching && !matches.length && <p className="field-hint" role="status">Buscando endereços em Blumenau…</p>}
    {query.trim() && !searching && !matches.length && <p className="field-hint" role="status">Nenhum local encontrado em Blumenau. Tente outro termo.</p>}
  </div>
}
