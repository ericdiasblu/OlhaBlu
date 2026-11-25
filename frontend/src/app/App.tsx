import { lazy, Suspense, useCallback, useState } from 'react'
import { ChevronDown, CircleHelp, MapPin, MapPinned, RefreshCw, SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FilterSelect } from '@/components/ui/filter-select'
import { MapPlaceholder } from '@/features/map/map-placeholder'
import { OccurrenceCard } from '@/features/occurrences/occurrence-card'
import { OccurrenceDetails } from '@/features/occurrences/occurrence-details'
import { useOccurrences } from '@/features/occurrences/use-occurrences'
import type { Bbox, Filters } from '@/features/occurrences/types'
import { formatDate } from '@/lib/utils'

const OccurrenceMap = lazy(() => import('@/features/map/occurrence-map').then(module => ({ default: module.OccurrenceMap })))

export function App() {
  const [bbox, setBbox] = useState<Bbox>([-49.15, -27, -48.98, -26.82])
  const [filters, setFilters] = useState<Filters>({ typeId: '', status: 'active', freshness: 'current' })
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const onBoundsChange = useCallback((bounds: Bbox) => setBbox(bounds), [])
  const onSelect = useCallback((id: string) => setSelectedId(current => current === id ? null : id), [])
  const data = useOccurrences(bbox, filters)
  const selected = data.items.find(occurrence => occurrence.id === selectedId)
  const hasSimulations = data.items.some(occurrence => occurrence.is_simulated)
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
    aria-label="Atualizar ocorrências" disabled={data.loading}>
    <RefreshCw size={20} className={data.loading ? 'animate-spin' : ''} />
  </button>

  return <div className="app-shell" id="mapa">
    <a className="skip-link" href="#ocorrencias">Ir para as ocorrências</a>
    <header className="site-header">
      <a className="brand" href="/" aria-label="OlhaBlu, página inicial">
        <img className="brand-mark" src="/olhablu-icon.png" width={40} height={40} alt="" />
        <strong>OlhaBlu</strong>
      </a>
      <nav aria-label="Navegação principal" className="header-nav">
        <a href="#mapa" className="nav-active" aria-current="page">Explorar mapa</a>
        <span className="nav-label">Sobre o projeto</span>
      </nav>
      <span className="city-label"><MapPin size={18} aria-hidden="true" /> Blumenau, SC</span>
    </header>

    <main>
      <section className="explorer" aria-label="Consulta de ocorrências">
        <div className="map-panel">
          {import.meta.env.VITE_MAPBOX_TOKEN ? <Suspense fallback={<MapPlaceholder loading />}>
            <OccurrenceMap occurrences={data.items} selectedId={selectedId} onSelect={onSelect} onBoundsChange={onBoundsChange} />
          </Suspense> : <MapPlaceholder />}
        </div>
        <aside className="occurrence-panel" id="ocorrencias" tabIndex={-1} aria-labelledby="occurrences-title">
          <div className="panel-heading">
            <div>
              <h1 id="occurrences-title">Ocorrências</h1>
              {hasSimulations && <p>{data.items.every(occurrence => occurrence.is_simulated) ? 'Dados de demonstração' : 'Inclui dados de demonstração'}</p>}
            </div>
            {refresh}
          </div>
          <div className="status-switch" role="group" aria-label="Situação">
            <button type="button" aria-pressed={filters.status === 'active'} onClick={() => updateFilters({ status: 'active' })}>Ativas</button>
            <button type="button" aria-pressed={filters.status === 'resolved'} onClick={() => updateFilters({ status: 'resolved' })}>Resolvidas</button>
          </div>
          <div className="results-heading">
            <p aria-live="polite">{data.loading && !data.items.length ? 'Consultando região…' : data.error ? 'Consulta indisponível' : `${data.items.length} ocorrência${data.items.length === 1 ? '' : 's'}`}</p>
            {filterToggle}
          </div>
          <div className={filtersOpen ? 'filters filters-open' : 'filters'} id="occurrence-filters" inert={!filtersOpen}>
            <div className="filters-inner">
              <FilterSelect id="type" label="Tipo" value={filters.typeId || 'all'}
                onChange={value => updateFilters({ typeId: value === 'all' ? '' : value })}
                options={[{ value: 'all', label: 'Todos os tipos' }, ...data.types.map(type => ({
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
          <div className="results-list" aria-busy={data.loading}>
            {data.error ? <div className="empty-state" role="alert"><CircleHelp size={30} strokeWidth={1.5} />
              <h3>Não foi possível atualizar</h3><p>{data.error}</p>
              <Button variant="outline" size="sm" onClick={data.refresh}>Tentar novamente</Button>
            </div> : !data.loading && data.items.length === 0 ? <div className="empty-state"><MapPinned size={34} strokeWidth={1.4} />
              <h3>Nenhum relato por aqui</h3><p>Nenhuma ocorrência publicada corresponde à área e aos filtros selecionados. Isso não garante ausência de riscos.</p>
            </div> : data.items.map(occurrence => <div className="occurrence-row" key={occurrence.id}>
              <OccurrenceCard occurrence={occurrence}
                selected={selectedId === occurrence.id} onSelect={() => onSelect(occurrence.id)} />
              {selectedId === occurrence.id && <div className="details-inline">
                <OccurrenceDetails occurrence={occurrence} onClose={() => closeDetails(occurrence.id)} />
              </div>}
            </div>)}
            {data.loading && data.items.length === 0 && <div className="empty-state" aria-hidden="true"><RefreshCw className="animate-spin" /></div>}
            {data.has_more && <p className="limit-note">Exibindo os primeiros 100 relatos. Aproxime o mapa para consultar uma área menor.</p>}
          </div>
          {data.updatedAt && <div className="panel-footer">Consulta atualizada em {formatDate(data.updatedAt)}</div>}
        </aside>
        {selected && <div className="details-overlay" key={selected.id}>
          <OccurrenceDetails occurrence={selected} onClose={() => closeDetails(selected.id)} />
        </div>}
      </section>
    </main>
    <footer className="site-footer"><span>OlhaBlu · Blumenau, Santa Catarina</span><span>Construído para a comunidade.</span></footer>
  </div>
}
