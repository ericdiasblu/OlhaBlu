import { useState, type FormEvent } from 'react'
import { Bell, ClipboardList, FileText, Plus, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FilterSelect } from '@/components/ui/filter-select'
import { routes } from '@/app/navigation'
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

export function ReportsPage({ flow, onEdit, message }: { flow: Workspace; onEdit: (report: Report) => void; message?: string }) {
  const [filter, setFilter] = useState<Outcome | 'all'>('all')
  const own = flow.reports.filter(report => report.authorId === flow.account?.id)
  const visible = own.filter(report => filter === 'all' || report.status === filter)
  return <main className="workspace" id="conteudo">
    <WorkspaceHeading title="Meus relatos" description="Acompanhe o andamento e as decisões sobre as ocorrências que você enviou."
      action={<Button asChild><a href={routes.report}><Plus aria-hidden="true" /> Registrar ocorrência</a></Button>} />
    {message && <p className="workspace-notice" role="status">{message}</p>}
    <section className="workspace-panel workflow-panel" aria-label="Lista de meus relatos">
      <div className="workflow-toolbar">
        <h2>Histórico de relatos</h2>
        <FilterSelect<Outcome | 'all'> id="report-status" label="Situação" value={filter} onChange={setFilter}
          options={[{ value: 'all', label: 'Todas' }, { value: 'pending', label: outcomes.pending },
            { value: 'published', label: outcomes.published }, { value: 'revision', label: outcomes.revision },
            { value: 'rejected', label: outcomes.rejected }]} />
      </div>
      {visible.length ? <ul className="workflow-list">{visible.map(report => <li key={report.id}>
        <details className="workflow-disclosure">
          <summary><ReportSummary report={report} /></summary>
          <div className="workflow-expanded">
            <p className="report-description">{report.description}</p>
            {report.photo && <PhotoPreview photo={report.photo} />}
            {report.reason && <p className="workspace-notice">{report.reason}</p>}
            {report.status === 'revision' && <Button type="button" variant="outline" onClick={() => onEdit(report)}>Corrigir relato</Button>}
          </div>
        </details>
      </li>)}</ul> : <WorkspaceEmpty icon={<FileText />} title={own.length ? 'Nenhum relato nesta situação' : 'Seus relatos aparecem aqui'}
        description={own.length ? 'Escolha outra situação para consultar o histórico.' : 'Registre uma ocorrência para acompanhar a análise.'} />}
    </section>
  </main>
}

function ReviewReport({ report, onReview }: { report: Report; onReview: (status: Exclude<Outcome, 'pending'>, reason: string) => void }) {
  const [decision, setDecision] = useState<Exclude<Outcome, 'pending'>>('published')
  const [reason, setReason] = useState('')
  const [invalid, setInvalid] = useState(false)

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!reason.trim()) {
      setInvalid(true)
      return
    }
    onReview(decision, reason.trim())
  }

  return <form className="workspace-form" onSubmit={submit}>
    <h2>{report.type.label}</h2>
    <p className="workflow-row-meta">{report.place.name} · {formatDate(report.createdAt)}</p>
    <p className="report-description">{report.description}</p>
    {report.photo && <PhotoPreview photo={report.photo} />}
    <FilterSelect<Exclude<Outcome, 'pending'>> id="review-decision" label="Decisão" value={decision} onChange={setDecision}
      options={[{ value: 'published', label: 'Aprovar e publicar' }, { value: 'revision', label: 'Solicitar correção' }, { value: 'rejected', label: 'Rejeitar' }]} />
    <label>Justificativa<textarea value={reason} onChange={event => { setReason(event.target.value); setInvalid(false) }}
      maxLength={300} rows={3} required placeholder="Descreva o motivo da decisão para o autor." /></label>
    {invalid && <p className="form-error" role="alert">Informe o motivo da decisão.</p>}
    <div><Button type="submit">Registrar decisão</Button></div>
  </form>
}

export function ModerationPage({ flow }: { flow: Workspace }) {
  const [tab, setTab] = useState<'reports' | 'complaints' | 'history'>('reports')
  const [selectedId, setSelectedId] = useState<string>()
  const [feedback, setFeedback] = useState('')
  const pending = flow.reports.filter(report => report.status === 'pending')
  const complaints = flow.complaints.filter(complaint => !complaint.reviewed)
  const reviewed = flow.decisions
  const report = pending.find(item => item.id === selectedId) ?? pending[0]
  const complaint = complaints.find(item => item.id === selectedId) ?? complaints[0]

  return <main className="workspace" id="conteudo">
    <WorkspaceHeading title="Moderação" description="Analise propostas da comunidade e acompanhe as decisões registradas." />
    <p className="workspace-notice">Acesso de moderação de demonstração. As decisões ficam nesta sessão.</p>
    {feedback && <p className="workspace-feedback" role="status">{feedback}</p>}
    <div className="workspace-columns moderation-columns">
      <section className="workspace-panel workflow-panel" aria-label="Fila de moderação">
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
        </li>)}</ul> : <WorkspaceEmpty icon={<ClipboardList />} title="Fila de relatos vazia" description="Novos relatos entram aqui para análise." />)}
        {tab === 'complaints' && (complaints.length ? <ul className="workflow-list">{complaints.map(item => <li key={item.id}>
          <button type="button" className="workflow-select-row" aria-pressed={item.id === complaint?.id} onClick={() => setSelectedId(item.id)}>
            <span className="workflow-row-title">{item.occurrence.occurrence_type.label}</span><span className="workflow-row-meta">{item.reason}</span>
          </button>
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
      {tab === 'reports' && report && <section className="workspace-panel" aria-label="Detalhes para análise">
        <ReviewReport key={report.id} report={report} onReview={(decision, reason) => {
          flow.reviewReport(report, decision, reason)
          setFeedback('Decisão registrada.')
        }} />
      </section>}
      {tab === 'complaints' && complaint && <section className="workspace-panel workspace-form" aria-label="Analisar denúncia">
        <h2>{complaint.occurrence.occurrence_type.label}</h2>
        <p className="report-description">{complaint.occurrence.description}</p>
        <p className="workspace-notice">{complaint.reason}</p>
        <div><Button type="button" onClick={() => { flow.reviewComplaint(complaint.id); setFeedback('Denúncia analisada.') }}>Marcar como analisada</Button></div>
      </section>}
    </div>
  </main>
}

export function AlertsPage({ flow }: { flow: Workspace }) {
  const [unread, setUnread] = useState(false)
  const visible = flow.notices.filter(notice => !unread || !notice.read)
  return <main className="workspace" id="conteudo">
    <WorkspaceHeading title="Alertas" description="Acompanhe as atualizações dos seus relatos." />
    <div className="workspace-columns">
      <section className="workspace-panel workflow-panel" aria-label="Central de alertas">
        <div className="workflow-toolbar">
          <Button type="button" variant="ghost" aria-pressed={unread} onClick={() => setUnread(value => !value)}>Só não lidos</Button>
          <Button type="button" variant="ghost" onClick={flow.markAllRead} disabled={flow.notices.every(notice => notice.read)}>Marcar todos como lidos</Button>
        </div>
        {visible.length ? <ul className="workflow-list">{visible.map(notice => <li className="workflow-static-row" key={notice.id} data-unread={!notice.read}>
          <div className="workflow-row-title"><strong>{notice.title}</strong>{!notice.read && <span className="workspace-status">Não lido</span>}</div>
          <p className="report-description">{notice.body}</p>
          <p className="workflow-row-meta">{formatDate(notice.time)}</p>
          {!notice.read && <Button type="button" variant="ghost" onClick={() => flow.markRead(notice.id)}>Marcar como lido</Button>}
        </li>)}</ul> : <WorkspaceEmpty icon={<Bell />} title={unread ? 'Nenhum alerta não lido' : 'Você ainda não tem alertas'}
          description="As decisões sobre seus relatos aparecem nesta central." />}
      </section>
      <aside className="workspace-panel workspace-aside">
        <h2>Preferências</h2>
        <label className="preference-control"><input type="checkbox" checked={flow.alertsEnabled}
          onChange={event => flow.setAlertsEnabled(event.target.checked)} /> Receber alertas no app</label>
        <p className="field-hint" role="status">{flow.alertsEnabled ? 'Alertas no app ativados nesta sessão.' : 'Alertas no app desativados nesta sessão.'}</p>
        <label className="preference-control"><input type="checkbox" checked={flow.pushEnabled}
          onChange={event => flow.setPushEnabled(event.target.checked)} /> Permitir notificações no navegador</label>
        <p className="field-hint">Preferência de demonstração. O envio pelo navegador depende da integração de Web Push.</p>
      </aside>
    </div>
  </main>
}
