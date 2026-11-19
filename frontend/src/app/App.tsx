import { lazy, Suspense, useCallback, useState } from 'react'
import { ArrowDown, ArrowUpRight, CircleHelp, Layers2, MapPin, MapPinned, RefreshCw, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MapPlaceholder } from '@/features/map/map-placeholder'
import { OccurrenceCard } from '@/features/occurrences/occurrence-card'
import { useOccurrences } from '@/features/occurrences/use-occurrences'
import type { Bbox, Filters } from '@/features/occurrences/types'
import { formatDate } from '@/lib/utils'

const OccurrenceMap = lazy(() => import('@/features/map/occurrence-map').then(module => ({ default: module.OccurrenceMap })))

export function App() {
  const [bbox, setBbox] = useState<Bbox>([-49.15, -27, -48.98, -26.82])
  const [filters, setFilters] = useState<Filters>({ typeId: '', status: 'active', freshness: 'current' })
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const onBoundsChange = useCallback((bounds: Bbox) => setBbox(bounds), [])
  const onSelect = useCallback((id: string) => setSelectedId(id), [])
  const data = useOccurrences(bbox, filters)

  return <div className="app-shell">
    <a className="skip-link" href="#ocorrencias">Ir para as ocorrências</a>
    <header className="site-header">
      <a className="brand" href="/" aria-label="AEX, página inicial">
        <span className="brand-mark"><MapPin size={23} strokeWidth={2.2} /></span>
        <span><strong>AEX<span className="brand-dot">.</span></strong><small>OCORRÊNCIAS URBANAS</small></span>
      </a>
      <nav aria-label="Navegação principal" className="header-nav">
        <a href="#mapa" className="nav-active">Explorar mapa</a>
        <a href="#sobre">Sobre o projeto <ArrowUpRight size={14} /></a>
      </nav>
      <span className="city-pill"><span /> Blumenau, SC</span>
    </header>

    <main>
      <section className="intro-section">
        <div><span className="eyebrow">INFORMAÇÃO QUE APROXIMA</span>
          <h1>Sua cidade, vista em conjunto<span>.</span></h1>
          <p>Consulte ocorrências e conheça a situação de cada região de Blumenau.</p>
        </div>
        <a className="intro-link" href="#ocorrencias">Explore a região <ArrowDown size={17} /></a>
      </section>

      <section className="explorer" id="mapa" aria-label="Consulta de ocorrências">
        <aside className="occurrence-panel" id="ocorrencias" tabIndex={-1}>
          <div className="panel-heading"><div><span className="eyebrow">NA ÁREA CONSULTADA</span><h2>Ocorrências</h2></div>
            <Button variant="outline" size="icon" onClick={data.refresh} aria-label="Atualizar ocorrências" disabled={data.loading}>
              <RefreshCw className={data.loading ? 'animate-spin' : ''} />
            </Button>
          </div>
          <div className="filters">
            <label htmlFor="type">Tipo de ocorrência</label>
            <select id="type" value={filters.typeId} onChange={event => setFilters({ ...filters, typeId: event.target.value })}>
              <option value="">Todos os tipos</option>
              {data.types.map(type => <option key={type.id} value={type.id}>{type.label}</option>)}
            </select>
            <div className="filter-grid">
              <div><label htmlFor="status">Situação</label>
                <select id="status" value={filters.status} onChange={event => setFilters({ ...filters, status: event.target.value as Filters['status'] })}>
                  <option value="active">Ativas</option><option value="resolved">Resolvidas</option>
                </select>
              </div>
              <div><label htmlFor="freshness">Atualidade</label>
                <select id="freshness" value={filters.freshness} onChange={event => setFilters({ ...filters, freshness: event.target.value as Filters['freshness'] })}>
                  <option value="current">Recentes</option><option value="expired">Sem confirmação</option><option value="all">Todas</option>
                </select>
              </div>
            </div>
          </div>
          <div className="results-heading" aria-live="polite">
            <span>{data.loading ? 'Consultando região…' : data.error ? 'Consulta indisponível' : `${data.items.length} ocorrência${data.items.length === 1 ? '' : 's'}`}</span>
            {data.updatedAt && <span>{formatDate(data.updatedAt)}</span>}
          </div>
          <div className="results-list" aria-busy={data.loading}>
            {data.error ? <div className="empty-state" role="alert"><CircleHelp size={30} strokeWidth={1.5} />
              <h3>Não foi possível atualizar</h3><p>{data.error}</p>
              <Button variant="outline" size="sm" onClick={data.refresh}>Tentar novamente</Button>
            </div> : !data.loading && data.items.length === 0 ? <div className="empty-state"><MapPinned size={34} strokeWidth={1.4} />
              <h3>Nenhum relato por aqui</h3><p>Nenhuma ocorrência publicada corresponde à área e aos filtros selecionados. Isso não garante ausência de riscos.</p>
            </div> : data.items.map(occurrence => <OccurrenceCard key={occurrence.id} occurrence={occurrence}
              selected={selectedId === occurrence.id} onSelect={() => onSelect(occurrence.id)} />)}
            {data.loading && data.items.length === 0 && <div className="empty-state" role="status"><RefreshCw className="animate-spin" /><p>Consultando ocorrências…</p></div>}
            {data.has_more && <p className="limit-note">Exibindo os primeiros 100 relatos. Aproxime o mapa para consultar uma área menor.</p>}
          </div>
          <div className="panel-footer"><ShieldCheck size={15} /><span>Relatos comunitários identificados pela origem.</span></div>
        </aside>
        <div className="map-panel">
          {import.meta.env.VITE_MAPBOX_TOKEN ? <Suspense fallback={<MapPlaceholder loading />}>
            <OccurrenceMap occurrences={data.items} selectedId={selectedId} onSelect={onSelect} onBoundsChange={onBoundsChange} />
          </Suspense> : <MapPlaceholder />}
          <div className="map-caption"><Layers2 size={15} /><span>Mapa de ocorrências</span><span className="caption-separator" /><span>Blumenau</span></div>
        </div>
      </section>

      <section className="about-strip" id="sobre">
        <div><span className="about-icon"><ShieldCheck size={22} /></span><div><h2>Informação compartilhada, cidade mais conectada.</h2>
          <p>Um projeto acadêmico colaborativo para facilitar a consulta de situações de perigo. Os relatos não substituem orientações dos órgãos responsáveis.</p></div></div>
        <span className="project-tag">PROJETO APLICADO · SENAI</span>
      </section>
    </main>
    <footer className="site-footer"><span>AEX · Blumenau, Santa Catarina</span><span>Construído para a comunidade.</span></footer>
  </div>
}
