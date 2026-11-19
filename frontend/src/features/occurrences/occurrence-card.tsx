import { ArrowUpRight, Clock3, MapPin } from 'lucide-react'
import { cn, formatDate } from '@/lib/utils'
import type { Occurrence } from './types'

export function OccurrenceCard({ occurrence, selected, onSelect }:
  { occurrence: Occurrence; selected: boolean; onSelect: () => void }) {
  return (
    <button className={cn('occurrence-card', selected && 'occurrence-card-selected')} onClick={onSelect}
      aria-pressed={selected}>
      <div className="card-topline">
        <span className={cn('type-symbol', `type-${occurrence.occurrence_type.slug}`)}><MapPin size={19} /></span>
        <span className="card-title">{occurrence.occurrence_type.label}</span>
        <ArrowUpRight size={17} className="text-muted-foreground" />
      </div>
      <p className={selected ? 'card-description' : 'card-description line-clamp-2'}>{occurrence.description}</p>
      <div className="badge-row">
        <span className={cn('small-badge', occurrence.status === 'active' ? 'badge-active' : 'badge-resolved')}>
          {occurrence.status === 'active' ? 'Ativa' : 'Resolvida'}
        </span>
        <span className="small-badge">{occurrence.source === 'official' ? 'Fonte oficial' : 'Relato comunitário'}</span>
        {occurrence.is_simulated && <span className="small-badge badge-demo">SIMULAÇÃO</span>}
        {occurrence.freshness === 'expired' && <span className="small-badge badge-demo">Sem confirmação recente</span>}
      </div>
      <p className="card-date"><Clock3 size={12} /> Atualizada em {formatDate(occurrence.updated_at)}</p>
      {selected && <div className="card-details">
        <p>Registrada em {formatDate(occurrence.created_at)}</p>
        <p>Última confirmação: {occurrence.last_confirmed_at ? formatDate(occurrence.last_confirmed_at) : 'Sem confirmação'}</p>
        <p>Local: {occurrence.latitude.toFixed(5)}, {occurrence.longitude.toFixed(5)}</p>
      </div>}
    </button>
  )
}
