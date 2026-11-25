import { cn } from '@/lib/utils'
import type { Occurrence } from './types'

const timeFormat = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit',
})

export function OccurrenceCard({ occurrence, selected, onSelect }:
  { occurrence: Occurrence; selected: boolean; onSelect: () => void }) {
  return (
    <button type="button" id={`occurrence-${occurrence.id}`}
      className={cn('occurrence-card', selected && 'occurrence-card-selected')} onClick={onSelect} aria-pressed={selected}>
      <span className="card-topline">
        <span className={cn('type-symbol', `type-${occurrence.occurrence_type.slug}`)} aria-hidden="true"><span className="incident-glyph" /></span>
        <span className="card-summary">
          <span className="card-title">{occurrence.occurrence_type.label}</span>
          <span className="card-preview line-clamp-1">{occurrence.description}</span>
          {occurrence.is_simulated && <span className="row-note">Simulação</span>}
          {occurrence.freshness === 'expired' && <span className="row-note">Sem confirmação recente</span>}
        </span>
        <time dateTime={occurrence.updated_at} className="card-time">{timeFormat.format(new Date(occurrence.updated_at))}</time>
      </span>
    </button>
  )
}
