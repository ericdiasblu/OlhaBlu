import { lazy, Suspense, useCallback, useState } from 'react'
import { ChevronDown, CircleHelp, MapPinned, RefreshCw, Search, SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FilterSelect } from '@/components/ui/filter-select'
import { MapPlaceholder } from '@/features/map/map-placeholder'
import { OccurrenceCard } from '@/features/occurrences/occurrence-card'
import { OccurrenceDetails } from '@/features/occurrences/occurrence-details'
import { useOccurrences } from '@/features/occurrences/use-occurrences'
import type { Bbox, Filters } from '@/features/occurrences/types'
import { formatDate } from '@/lib/utils'
import { demoTypes, type Workspace } from '@/features/workspace/demo-workspace'
import { matchPlaces, type Place } from '@/features/location/blumenau'
import { OccurrenceActions } from './occurrence-actions'

const OccurrenceMap = lazy(() => import('@/features/map/occurrence-map').then(module => ({ default: module.OccurrenceMap })))

export function MapPage({ flow, showExamples, onExamples, active }: {
  flow: Workspace; showExamples: boolean; onExamples: (enabled: boolean) => void; active: boolean
}) {
  const [bbox, setBbox] = useState<Bbox>([-49.15, -27, -48.98, -26.82])
  const [filters, setFilters] = useState<Filters>({ typeId: '', status: 'active', freshness: 'current' })
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [center, setCenter] = useState<Place>()
  const [searching, setSearching] = useState(false)
  const [feedback, setFeedback] = useState('')
  const onBoundsChange = useCallback((bounds: Bbox) => setBbox(bounds), [])
  const onSelect = useCallback((id: string) => setSelectedId(current => current === id ? null : id), [])
  const data = useOccurrences(bbox, filters, !showExamples && active)
  const items = showExamples ? flow.demoOccurrences.filter(occurrence =>
    occurrence.status === filters.status && filters.freshness !== 'expired' &&
    (!filters.typeId || String(occurrence.occurrence_type.id) === filters.typeId) &&
    occurrence.longitude >= bbox[0] && occurrence.longitude <= bbox[2] &&
    occurrence.latitude >= bbox[1] && occurrence.latitude <= bbox[3]) : data.items
  const selected = items.find(occurrence => occurrence.id === selectedId)
  const hasSimulations = items.some(occurrence => occurrence.is_simulated)
  const error = !showExamples && data.error
  const loading = !showExamples && data.loading
  const types = showExamples ? demoTypes : data.types
  const results = matchPlaces(query, true)
  function updateFilters(next: Partial<Filters>) {
    setSelectedId(null)
    setFilters(current => ({ ...current, ...next }))
  }

  function closeDetails(id: string) {
    setSelectedId(null)
    document.getElementById(`occurrence-${id}`)?.focus({ preventScroll: true })
  }

  const filterToggle = <button type="button" className="filters-toggle" aria-expanded={filtersOpen}
    aria-controls="occurrence-filters" onClick={() => setFiltersOpen(open => !open)}>
    <SlidersHorizontal size={16} aria-hidden="true" /> Filtros
    <ChevronDown size={14} aria-hidden="true" className="filters-chevron" />
  </button>

  const refresh = <button type="button" className="refresh-button" onClick={data.refresh}
    aria-label="Atualizar ocorrências" disabled={loading}>
    <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
  </button>

  return <main id="map-content">
    <a className="skip-link" href="#ocorrencias">Ir para as ocorrências</a>
      <section className="explorer" aria-label="Consulta de ocorrências">
        <div className="map-panel">
          {import.meta.env.VITE_MAPBOX_TOKEN ? <Suspense fallback={<MapPlaceholder loading />}>
            <OccurrenceMap occurrences={items} center={center} selectedId={selectedId} onSelect={onSelect} onBoundsChange={onBoundsChange} active={active} />
          </Suspense> : <MapPlaceholder />}
        </div>
        <aside className="occurrence-panel" id="ocorrencias" tabIndex={-1} aria-labelledby="occurrences-title">
          <div className="panel-heading">
            <div>
              <h1 id="occurrences-title" tabIndex={-1}>Ocorrências</h1>
              {(showExamples || hasSimulations) && <p>{items.every(occurrence => occurrence.is_simulated) ? 'Dados de demonstração' : 'Inclui dados de demonstração'}</p>}
            </div>
            {!showExamples && refresh}
          </div>
          <div className="map-tools">
            <Button id="map-search-toggle" type="button" variant="ghost" aria-expanded={searching} aria-controls={searching ? 'map-search' : undefined}
              onClick={() => setSearching(open => !open)}><Search aria-hidden="true" /> Buscar local</Button>
            <Button type="button" variant="ghost" aria-pressed={showExamples} onClick={() => {
              setSelectedId(null)
              setFeedback('')
              onExamples(!showExamples)
            }}>{showExamples ? 'Dados reais' : 'Ver exemplos'}</Button>
          </div>
          {searching && <div className="map-search workspace-reveal" id="map-search">
            <label htmlFor="map-neighborhood">Bairro ou endereço em Blumenau</label>
            <input id="map-neighborhood" type="search" value={query} autoFocus
              onChange={event => setQuery(event.target.value)} placeholder="Ex. Centro" maxLength={100} />
            <ul>{results.map(place => <li key={place.name}><button type="button" onClick={() => {
              setCenter({ ...place })
              setBbox([place.longitude - .014, place.latitude - .014, place.longitude + .014, place.latitude + .014])
              setSelectedId(null)
              setFeedback('Área selecionada: ' + place.name)
              setSearching(false)
              document.getElementById('map-search-toggle')?.focus({ preventScroll: true })
            }}>{place.name}</button></li>)}</ul>
            {query.trim() && !results.length && <p className="field-hint" role="status">Nenhum local encontrado.</p>}
          </div>}
          {feedback && <p className="map-feedback" role="status">{feedback}</p>}
          <div className="status-switch" role="group" aria-label="Situação">
            <button type="button" aria-pressed={filters.status === 'active'} onClick={() => updateFilters({ status: 'active' })}>Ativas</button>
            <button type="button" aria-pressed={filters.status === 'resolved'} onClick={() => updateFilters({ status: 'resolved' })}>Resolvidas</button>
          </div>
          <div className="results-heading">
            <p aria-live="polite">{loading && !items.length ? 'Consultando região…' : error ? 'Consulta indisponível' : `${items.length} ocorrência${items.length === 1 ? '' : 's'}`}</p>
            {filterToggle}
          </div>
          <div className={filtersOpen ? 'filters filters-open' : 'filters'} id="occurrence-filters" inert={!filtersOpen}>
            <div className="filters-inner">
              <FilterSelect id="type" label="Tipo" value={filters.typeId || 'all'}
                onChange={value => updateFilters({ typeId: value === 'all' ? '' : value })}
                options={[{ value: 'all', label: 'Todos os tipos' }, ...types.map(type => ({
                  value: String(type.id), label: type.label,
                }))]} />
              <FilterSelect<Filters['freshness']> id="freshness" label="Atualidade" value={filters.freshness}
                onChange={freshness => updateFilters({ freshness })}
                options={[
                  { value: 'current', label: 'Recentes' },
                  { value: 'expired', label: 'Sem confirmação' },
                  { value: 'all', label: 'Todas' },
                ]} />
            </div>
          </div>
          <div className="results-list" aria-busy={loading}>
            {error ? <div className="empty-state" role="alert"><CircleHelp size={30} strokeWidth={1.5} />
              <h3>Não foi possível atualizar</h3><p>{error}</p>
              <Button variant="outline" size="sm" onClick={data.refresh}>Tentar novamente</Button>
            </div> : !loading && items.length === 0 ? <div className="empty-state"><MapPinned size={34} strokeWidth={1.4} />
              <h3>Nenhum relato por aqui</h3><p>Nenhuma ocorrência publicada corresponde à área e aos filtros selecionados. Isso não garante ausência de riscos.</p>
            </div> : items.map(occurrence => <div className="occurrence-row" key={occurrence.id}>
              <OccurrenceCard occurrence={occurrence}
                selected={selectedId === occurrence.id} onSelect={() => onSelect(occurrence.id)} />
              {selectedId === occurrence.id && <div className="details-inline">
                <OccurrenceDetails occurrence={occurrence} onClose={() => closeDetails(occurrence.id)} actions={<OccurrenceActions occurrence={occurrence} flow={flow} onFeedback={setFeedback} />} />
              </div>}
            </div>)}
            {loading && items.length === 0 && <div className="empty-state" aria-hidden="true"><RefreshCw className="animate-spin" /></div>}
            {!showExamples && data.has_more && <p className="limit-note">Exibindo os primeiros 100 relatos. Aproxime o mapa para consultar uma área menor.</p>}
          </div>
          {!showExamples && data.updatedAt && <div className="panel-footer">Consulta atualizada em {formatDate(data.updatedAt)}</div>}
        </aside>
        {selected && <div className="details-overlay" key={selected.id}>
          <OccurrenceDetails occurrence={selected} onClose={() => closeDetails(selected.id)} actions={<OccurrenceActions occurrence={selected} flow={flow} onFeedback={setFeedback} />} />
        </div>}
      </section>
    </main>
}
