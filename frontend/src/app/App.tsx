import { useEffect, useRef, useState } from 'react'
import { Bell, LogOut, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MapPage } from '@/features/map/map-page'
import { AuthPage } from '@/features/workspace/auth-page'
import { ReportPage } from '@/features/workspace/report-page'
import { AlertsPage, ModerationPage, ReportsPage } from '@/features/workspace/activity-pages'
import { WorkspaceHeading } from '@/features/workspace/workspace-ui'
import { useDemoWorkspace, type Account, type Report } from '@/features/workspace/demo-workspace'
import { navigate, routes, useRoute, type Route } from './navigation'
import './workspace.css'

const memberRoutes: Route[] = ['report', 'reports', 'alerts', 'moderation']

export function App() {
  const route = useRoute()
  const flow = useDemoWorkspace()
  const [showExamples, setShowExamples] = useState(false)
  const [editingId, setEditingId] = useState<string>()
  const [message, setMessage] = useState<string>()
  const [hasVisitedMap, setHasVisitedMap] = useState(route === 'map')
  const previousRoute = useRef(route)
  const guarded = memberRoutes.includes(route) && !flow.account
  const unread = flow.notices.filter(notice => !notice.read).length
  const editing = flow.reports.find(report => report.id === editingId && report.authorId === flow.account?.id && report.status === 'revision')

  useEffect(() => {
    if (previousRoute.current === route) return
    previousRoute.current = route
    if (route === 'map') setHasVisitedMap(true)
    window.scrollTo(0, 0)
    document.getElementById(route === 'map' ? 'occurrences-title' : 'workspace-title')?.focus({ preventScroll: true })
  }, [route])

  function signIn(account: Account) {
    flow.signIn(account)
    if (account.role === 'moderator') navigate('moderation')
    else if (!guarded || route === 'moderation') navigate('map')
  }

  function signOut() {
    flow.signIn(null)
    setEditingId(undefined)
    setMessage(undefined)
    navigate('map')
  }

  function editReport(report: Report) {
    setEditingId(report.id)
    setMessage(undefined)
    navigate('report')
  }

  const memberNav = flow.account && <nav className="member-nav" aria-label="Área da conta">
    {flow.account.role === 'resident' && <>
      <a href={routes.reports} aria-current={route === 'reports' ? 'page' : undefined}>Meus relatos</a>
      <a href={routes.alerts} aria-current={route === 'alerts' ? 'page' : undefined}>
        <Bell size={16} aria-hidden="true" /> Alertas {unread > 0 && <span className="unread-count" aria-label={`${unread} não lidos`}>{unread}</span>}
      </a>
      <Button asChild className="report-link"><a href={routes.report} onClick={() => setEditingId(undefined)}>
        <Plus aria-hidden="true" /> Registrar <span className="report-link-extra">ocorrência</span>
      </a></Button>
    </>}
    {flow.account.role === 'moderator' && <a href={routes.moderation} aria-current={route === 'moderation' ? 'page' : undefined}>Moderação</a>}
    <Button type="button" className="member-logout" variant="ghost" onClick={signOut}><LogOut aria-hidden="true" /> Sair</Button>
  </nav>

  let page
  if (route === 'login' || route === 'signup' || guarded) {
    page = <AuthPage key={route} mode={route === 'signup' ? 'signup' : 'login'} onSignIn={signIn} requiresAccount={guarded} />
  } else if (route === 'report' && flow.account?.role === 'resident') {
    page = <ReportPage key={editing?.id ?? 'new'} previous={editing} onSubmit={draft => {
      flow.submitReport(draft, editing?.id)
      setEditingId(undefined)
      setMessage(editing ? 'Correção enviada para análise.' : 'Relato enviado para análise.')
      navigate('reports')
    }} />
  } else if (route === 'reports' && flow.account?.role === 'resident') {
    page = <ReportsPage flow={flow} onEdit={editReport} message={message} />
  } else if (route === 'moderation' && flow.account?.role === 'moderator') {
    page = <ModerationPage flow={flow} />
  } else if (route === 'alerts' && flow.account?.role === 'resident') {
    page = <AlertsPage flow={flow} />
  } else if (route === 'about') {
    page = <main id="conteudo" className="workspace">
      <WorkspaceHeading title="Sobre o projeto" description="Um mapa colaborativo de ocorrências urbanas em Blumenau." />
      <section className="workspace-panel workspace-aside">
        <h2>Como funciona</h2>
        <p>Qualquer pessoa pode consultar as ocorrências publicadas. Quem tem conta pode enviar relatos, confirmar informações e encaminhar denúncias.</p>
        <p>Relatos em análise só são visíveis para quem enviou e para a moderação. O mapa ajuda na consulta e não substitui as orientações dos órgãos responsáveis.</p>
        <Button asChild variant="outline"><a href={routes.map}>Explorar mapa</a></Button>
      </section>
    </main>
  } else if (route !== 'map') {
    page = <main id="conteudo" className="workspace">
      <WorkspaceHeading title="Área restrita" description="Este fluxo está reservado ao perfil correspondente na demonstração."
        action={<Button asChild><a href={routes.map}>Voltar ao mapa</a></Button>} />
    </main>
  }

  return <div className="app-shell" id="mapa">
    <a className="skip-link" href={route === 'map' ? '#map-content' : '#conteudo'} onClick={event => {
      event.preventDefault()
      document.getElementById(route === 'map' ? 'occurrences-title' : 'workspace-title')?.focus()
    }}>Ir para o conteúdo</a>
    <header className={flow.account ? 'site-header member-header' : 'site-header'}>
      <a className="brand" href={routes.map} aria-label="OlhaBlu, página inicial">
        <img className="brand-mark" src="/olhablu-icon.png" width={40} height={40} alt="" />
        <strong>OlhaBlu</strong>
      </a>
      <nav aria-label="Navegação principal" className="header-nav">
        <a href={routes.map} className={route === 'map' ? 'nav-active' : undefined} aria-current={route === 'map' ? 'page' : undefined}>Explorar mapa</a>
        <a href={routes.about} className={route === 'about' ? 'nav-active' : undefined} aria-current={route === 'about' ? 'page' : undefined}>Sobre o projeto</a>
      </nav>
      {memberNav ?? <div className="header-account">
        <Button asChild variant="ghost"><a href={routes.login}>Entrar</a></Button>
        <Button asChild><a href={routes.signup}>Criar conta</a></Button>
      </div>}
    </header>
    {(route === 'map' || hasVisitedMap) && <div hidden={route !== 'map'}>
      <MapPage flow={flow} showExamples={showExamples} onExamples={setShowExamples} active={route === 'map'} />
    </div>}
    {page}
    <footer className="site-footer">
      <span>OlhaBlu · Blumenau, Santa Catarina</span>
      <a href={routes.about}>Sobre o projeto</a>
    </footer>
  </div>
}
