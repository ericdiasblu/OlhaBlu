import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Bell, Check, CheckCheck, ClipboardList, FileText, MapPin, Monitor, Pencil, Plus, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FilterSelect } from '@/components/ui/filter-select'
import { routes } from '@/app/navigation'
import { apiUrl } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import { outcomes, type Outcome, type Report, type Workspace } from './demo-workspace'
import { PhotoPreview } from './report-page'
import { WorkspaceEmpty, WorkspaceHeading } from './workspace-ui'

function ReportStatus({ status }: { status: Outcome }) {
  return <span className="workspace-status" data-outcome={status}>{outcomes[status]}</span>
}

function ReportSummary({ report }: { report: Report }) {
  return <>
    <span className="workflow-row-title"><span>{report.type.label}</span><ReportStatus status={report.status} /></span>
    <span className="workflow-row-meta">{report.place.name} · {formatDate(report.createdAt)}</span>
  </>
}

export function ReportsPage({ flow, onEdit, onCreate, message }: {
  flow: Workspace; onEdit: (report: Report) => void; onCreate: () => void; message?: string
}) {
  const [filter, setFilter] = useState<Outcome | 'all'>('all')
  const own = flow.reports
  const visible = own.filter(report => filter === 'all' || report.status === filter)
  const hasReports = own.length > 0
  const createAction = <Button asChild><a href={routes.report} onClick={onCreate}><Plus aria-hidden="true" /> Registrar ocorrência</a></Button>
  return <main className="workspace" id="conteudo">
    <WorkspaceHeading title="Meus relatos" description="Acompanhe o andamento e as decisões sobre as ocorrências que você enviou."
      action={hasReports ? createAction : undefined} />
    {message && <p className="workspace-notice" role="status">{message}</p>}
    <section className="workspace-panel workflow-panel reports-panel" aria-label="Lista de meus relatos">
      {hasReports && <div className="workflow-toolbar">
        <h2>Histórico de relatos</h2>
        <FilterSelect<Outcome | 'all'> id="report-status" label="Situação" value={filter} onChange={setFilter}
          options={[{ value: 'all', label: 'Todas' }, { value: 'pending', label: outcomes.pending },
            { value: 'published', label: outcomes.published }, { value: 'revision', label: outcomes.revision },
            { value: 'rejected', label: outcomes.rejected }]} />
      </div>}
      {visible.length ? <ul className="workflow-list">{visible.map(report => <li className="report-list-row" key={report.id}>
        <details className="workflow-disclosure">
          <summary>
            <span className="report-summary">
              <span className="workflow-row-title"><strong>{report.type.label}</strong><ReportStatus status={report.status} /></span>
              <span className="report-neighborhood"><MapPin size={15} aria-hidden="true" /> {report.place.name}
                <span aria-hidden="true">·</span><time dateTime={report.createdAt}>{formatDate(report.createdAt).replace(', ', ' às ')}</time>
              </span>
            </span>
          </summary>
          <div className="workflow-expanded report-expanded" data-photo={report.hasPhoto}>
            <div className="report-description-block">
              <h3>Descrição</h3>
              <p className="report-description">{report.description}</p>
              {report.status === 'pending' && <p className="field-hint">Aguardando avaliação da moderação.</p>}
              {report.reason && <p className="workspace-notice">
                {report.status === 'revision' && <strong>Motivo da correção: </strong>}{report.reason}
              </p>}
            </div>
            {report.hasPhoto && <div className="report-attachment"><h3>Foto anexada</h3><PhotoPreview src={apiUrl(`/occurrences/${report.id}/photo`)} expandable /></div>}
          </div>
        </details>
        {report.status === 'revision' && <div className="report-row-actions">
          <Button type="button" variant="outline" onClick={() => onEdit(report)}><Pencil aria-hidden="true" /> Corrigir relato</Button>
        </div>}
      </li>)}</ul> : <div className={hasReports ? undefined : 'reports-first-use'}>
        <WorkspaceEmpty icon={<FileText aria-hidden="true" />} title={hasReports ? 'Nenhum relato nesta situação' : 'Você ainda não enviou nenhum relato'}
          description={hasReports ? 'Escolha outra situação para consultar o histórico.' : 'Depois de registrar uma ocorrência, acompanhe a análise por aqui.'}
          action={hasReports ? undefined : createAction} />
      </div>}
    </section>
  </main>
}

function ReviewReport({ report, onReview }: {
  report: Report
  onReview: (status: Exclude<Outcome, 'pending'>, reason: string) => Promise<void>
}) {
  const [decision, setDecision] = useState<Exclude<Outcome, 'pending'>>('published')
  const [reason, setReason] = useState('')
  const [invalid, setInvalid] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!reason.trim()) {
      setInvalid(true)
      return
    }
    setError('')
    setSubmitting(true)
    try {
      await onReview(decision, reason.trim())
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível registrar a decisão.')
    } finally {
      setSubmitting(false)
    }
  }

  return <form className="workspace-form" onSubmit={submit}>
    <h2>{report.type.label}</h2>
    <p className="workflow-row-meta">{report.place.name} · {formatDate(report.createdAt)}</p>
    <div className="form-section">
      <h3>Descrição</h3>
      <p className="report-description">{report.description}</p>
    </div>
    {report.hasPhoto && <div className="form-section moderation-attachment"><h3>Foto anexada</h3><PhotoPreview src={apiUrl(`/occurrences/${report.id}/photo`)} expandable /></div>}
    <div className="form-section">
      <FilterSelect<Exclude<Outcome, 'pending'>> id="review-decision" label="Decisão" value={decision} onChange={setDecision}
        options={[{ value: 'published', label: 'Aprovar e publicar' }, { value: 'revision', label: 'Solicitar correção' }, { value: 'rejected', label: 'Rejeitar' }]} />
      <label>Justificativa<textarea value={reason} onChange={event => { setReason(event.target.value); setInvalid(false) }}
        maxLength={300} rows={3} required placeholder="Descreva o motivo da decisão para o autor." /></label>
      {invalid && <p className="form-error" role="alert">Informe o motivo da decisão.</p>}
      {error && <p className="form-error" role="alert">{error}</p>}
      <div><Button type="submit" disabled={submitting}>{submitting ? 'Registrando…' : 'Registrar decisão'}</Button></div>
    </div>
  </form>
}

export function ModerationPage({ flow }: { flow: Workspace }) {
  const [tab, setTab] = useState<'reports' | 'complaints' | 'history'>('reports')
  const [selectedId, setSelectedId] = useState<string>()
  const [feedback, setFeedback] = useState('')
  const [compact, setCompact] = useState(() => window.matchMedia('(max-width: 760px)').matches)
  useEffect(() => {
    const viewport = window.matchMedia('(max-width: 760px)')
    const update = () => setCompact(viewport.matches)
    viewport.addEventListener('change', update)
    return () => viewport.removeEventListener('change', update)
  }, [])
  const pending = flow.pendingReports
  const complaints = flow.complaints.filter(complaint => !complaint.reviewed)
  const reviewed = flow.decisions
  const report = pending.find(item => item.id === selectedId) ?? pending[0]
  const complaint = complaints.find(item => item.id === selectedId) ?? complaints[0]
  const inspector = tab === 'reports' && report ? <section className="workspace-panel moderation-inspector" aria-label="Detalhes para análise">
    <ReviewReport key={report.id} report={report} onReview={async (decision, reason) => {
      await flow.reviewReport(report, decision, reason)
      setFeedback('Decisão registrada com sucesso.')
    }} />
  </section> : tab === 'complaints' && complaint ? <section className="workspace-panel workspace-form moderation-inspector" aria-label="Analisar denúncia">
    <h2>{complaint.occurrence.occurrence_type.label}</h2>
    <p className="report-description">{complaint.occurrence.description}</p>
    <p className="workspace-notice">{complaint.reason}</p>
    <div><Button type="button" onClick={async () => {
      try {
        await flow.reviewComplaint(complaint.id)
        setFeedback('Denúncia analisada.')
      } catch (cause) {
        setFeedback(cause instanceof Error ? cause.message : 'Não foi possível analisar a denúncia.')
      }
    }}>Marcar como analisada</Button></div>
  </section> : null

  return <main className="workspace" id="conteudo">
    <div className="moderation-heading">
      <WorkspaceHeading title="Moderação" description="Analise propostas da comunidade e acompanhe as decisões registradas." />
    </div>
    {feedback && <p className="workspace-feedback" role="status">{feedback}</p>}
    <div className="workspace-columns moderation-columns" data-inspector={Boolean(inspector)}>
      <section className="workspace-panel workflow-panel moderation-queue" aria-label="Fila de moderação">
        <div className="workflow-tabs" role="group" aria-label="Fila de moderação">
          {(['reports', 'complaints', 'history'] as const).map(section => <Button key={section} type="button" variant="ghost"
            aria-pressed={tab === section} onClick={() => { setTab(section); setSelectedId(undefined) }}>
            {section === 'reports' ? `Relatos (${pending.length})` : section === 'complaints' ? `Denúncias (${complaints.length})` : 'Histórico'}
          </Button>)}
        </div>
        {tab === 'reports' && (pending.length ? <ul className="workflow-list">{pending.map(item => <li key={item.id}>
          <button type="button" className="workflow-select-row" aria-pressed={item.id === report?.id} onClick={() => setSelectedId(item.id)}>
            <ReportSummary report={item} />
          </button>
          {compact && report?.id === item.id && inspector}
        </li>)}</ul> : <WorkspaceEmpty icon={<ClipboardList aria-hidden="true" />} title="Nenhum relato pendente" description="Quando alguém enviar um relato, ele aparecerá aqui para análise." />)}
        {tab === 'complaints' && (complaints.length ? <ul className="workflow-list">{complaints.map(item => <li key={item.id}>
          <button type="button" className="workflow-select-row" aria-pressed={item.id === complaint?.id} onClick={() => setSelectedId(item.id)}>
            <span className="workflow-row-title">{item.occurrence.occurrence_type.label}</span><span className="workflow-row-meta">{item.reason}</span>
          </button>
          {compact && complaint?.id === item.id && inspector}
        </li>)}</ul> : <WorkspaceEmpty icon={<ShieldCheck />} title="Nenhuma denúncia pendente" description="Denúncias enviadas pelo mapa aparecem aqui." />)}
        {tab === 'history' && (reviewed.length || flow.complaints.some(item => item.reviewed) ? <ul className="workflow-list">
          {reviewed.map(item => <li className="workflow-static-row" key={item.id}>
            <div className="workflow-row-title"><strong>{item.report.type.label}</strong><ReportStatus status={item.status} /></div>
            <p className="workflow-row-meta">{item.report.place.name} · {formatDate(item.time)}</p>
            <p className="report-description">{item.reason}</p>
          </li>)}
          {flow.complaints.filter(item => item.reviewed).map(item => <li className="workflow-static-row" key={item.id}><strong>{item.occurrence.occurrence_type.label}</strong><p className="workflow-row-meta">Denúncia analisada · {item.reason}</p></li>)}
        </ul> : <WorkspaceEmpty icon={<ClipboardList />} title="Sem decisões registradas" description="O histórico aparece após a primeira análise." />)}
      </section>
      {!compact && inspector}
    </div>
  </main>
}

export function AlertsPage({ flow }: { flow: Workspace }) {
  const [onlyUnread, setOnlyUnread] = useState(false)
  const allFilter = useRef<HTMLButtonElement>(null)
  const unreadCount = flow.notices.filter(notice => !notice.read).length
  const visible = onlyUnread ? flow.notices.filter(notice => !notice.read) : flow.notices
  const hasAlerts = flow.notices.length > 0

  function markAsRead(id?: string) {
    allFilter.current?.focus({ preventScroll: true })
    if (id) void flow.markRead(id)
    else void flow.markAllRead()
  }

  return <main className="workspace" id="conteudo">
    <WorkspaceHeading title="Alertas" description="Veja quando seus relatos forem analisados ou precisarem de correção." />
    <div className="workspace-columns alerts-columns">
      <section className="workspace-panel workflow-panel alerts-panel" aria-label="Central de alertas">
        {hasAlerts && <div className="alerts-toolbar">
          <div className="alerts-filter" role="group" aria-label="Filtrar alertas">
            <Button ref={allFilter} type="button" variant="ghost" aria-pressed={!onlyUnread} onClick={() => setOnlyUnread(false)}>Todos</Button>
            <Button type="button" variant="ghost" aria-pressed={onlyUnread} onClick={() => setOnlyUnread(true)}>
              Não lidos <span className="alerts-count">{unreadCount}</span>
            </Button>
          </div>
          {unreadCount > 0 && <Button type="button" variant="ghost" onClick={() => markAsRead()}><CheckCheck aria-hidden="true" /> Marcar todos como lidos</Button>}
        </div>}
        <p className="sr-only" role="status">{unreadCount === 1 ? '1 alerta não lido' : `${unreadCount} alertas não lidos`}</p>
        {visible.length > 0 ? <ul className="workflow-list">{visible.map(notice => <li className="alert-row" key={notice.id} data-unread={!notice.read}>
          <span className="alert-row-icon" aria-hidden="true"><Bell size={18} /></span>
          <div className="alert-row-content">
            <div className="workflow-row-title"><strong>{notice.title}</strong>{!notice.read && <span className="workspace-status">Não lido</span>}</div>
            <p className="report-description">{notice.body}</p>
            <time className="workflow-row-meta" dateTime={notice.time}>{formatDate(notice.time)}</time>
          </div>
          {!notice.read && <Button type="button" size="icon" variant="ghost" className="alert-read-button" title="Marcar como lido"
            aria-label={`Marcar como lido: ${notice.title}`} onClick={() => markAsRead(notice.id)}><Check aria-hidden="true" /></Button>}
        </li>)}</ul> : <WorkspaceEmpty icon={<Bell aria-hidden="true" />} title={onlyUnread ? 'Você está em dia' : 'Você ainda não tem alertas'}
          description={onlyUnread ? 'Todos os seus alertas já foram lidos.' : 'Quando houver uma atualização em um relato seu, ela vai aparecer aqui.'}
          action={hasAlerts
            ? <Button type="button" variant="outline" onClick={() => { setOnlyUnread(false); allFilter.current?.focus() }}>Ver todos os alertas</Button>
            : <Button asChild variant="outline"><a href={routes.reports}>Ver meus relatos</a></Button>} />}
      </section>
      <aside className="workspace-panel alerts-preferences" aria-labelledby="alerts-preferences-title">
        <h2 id="alerts-preferences-title">Preferências de alertas</h2>
        <label className="alert-preference">
          <Bell size={18} aria-hidden="true" />
          <span><strong id="in-app-alert-title">Alertas no app</strong><span className="field-hint" id="in-app-alert-hint">Receba atualizações dos seus relatos nesta central.</span></span>
          <input type="checkbox" role="switch" aria-labelledby="in-app-alert-title" aria-describedby="in-app-alert-hint"
            checked={flow.alertsEnabled} onChange={event => void flow.setAlertsEnabled(event.target.checked)} />
        </label>
        <label className="alert-preference">
          <Monitor size={18} aria-hidden="true" />
          <span><strong id="browser-alert-title">Notificações no navegador</strong><span className="field-hint" id="browser-alert-hint">Preferência salva na conta. O envio depende da integração de Web Push.</span></span>
          <input type="checkbox" role="switch" aria-labelledby="browser-alert-title" aria-describedby="browser-alert-hint"
            checked={flow.pushEnabled} onChange={event => void flow.setPushEnabled(event.target.checked)} />
        </label>
      </aside>
    </div>
  </main>
}
