import type { ReactNode } from 'react'
import { MapPin, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { matchPlaces, type Place } from './demo-workspace'

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
  const matches = query.trim() ? matchPlaces(query) : matchPlaces('').slice(0, 3)
  return <div className="place-picker">
    <label htmlFor={id}>Buscar bairro</label>
    <div className="place-input"><Search size={17} aria-hidden="true" /><input id={id} type="search" value={query}
      onChange={event => onQuery(event.target.value)} placeholder="Ex. Centro" autoComplete="off" maxLength={100} /></div>
    <p className="field-hint">Pontos de referência de Blumenau disponíveis na demonstração.</p>
    <div className="place-list" aria-label="Bairros disponíveis">
      {matches.map(place => <Button key={place.name} type="button" variant="ghost"
        aria-pressed={selected?.name === place.name} onClick={() => onChoose(place)}>
        <MapPin aria-hidden="true" /> {place.name}
      </Button>)}
    </div>
    {!matches.length && <p className="field-hint" role="status">Nenhum bairro encontrado. Tente outro nome.</p>}
  </div>
}
