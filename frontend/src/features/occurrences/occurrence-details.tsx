import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { formatDate } from '@/lib/utils'
import type { Occurrence } from './types'

export function OccurrenceDetails({ occurrence, onClose, actions }: { occurrence: Occurrence; onClose: () => void; actions?: ReactNode }) {
  return <section className="occurrence-details" aria-label="Detalhes da ocorrência">
    <span className="detail-icon" data-incident-type={occurrence.occurrence_type.slug} aria-hidden="true">
      <span className="incident-glyph" />
    </span>
    <div className="detail-content">
      <div className="detail-heading">
        <h2>{occurrence.occurrence_type.label}</h2>
        <span className="detail-status" data-status={occurrence.status}>{occurrence.status === 'active' ? 'Ativa' : 'Resolvida'}</span>
      </div>
      <p className="detail-description">{occurrence.description}</p>
      <p className="detail-source">
        {occurrence.source === 'official' ? 'Fonte oficial' : 'Relato comunitário'}
        {occurrence.is_simulated && ' · Simulação'}
      </p>
      <dl className="detail-metadata">
        <div><dt>Atualizada</dt><dd>{formatDate(occurrence.updated_at)}</dd></div>
        <div><dt>Registrada</dt><dd>{formatDate(occurrence.created_at)}</dd></div>
        <div><dt>Última confirmação</dt><dd>{occurrence.last_confirmed_at ? formatDate(occurrence.last_confirmed_at) : 'Sem confirmação'}</dd></div>
        <div><dt>Local</dt><dd>{occurrence.latitude.toFixed(5)}, {occurrence.longitude.toFixed(5)}</dd></div>
      </dl>
      {occurrence.freshness === 'expired' && <p className="row-note">Sem confirmação recente</p>}
      {actions && <div className="detail-actions">{actions}</div>}
    </div>
    <button type="button" className="detail-close" onClick={onClose} aria-label="Fechar detalhes"><X size={20} /></button>
  </section>
}
