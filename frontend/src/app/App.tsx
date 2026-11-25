import { useEffect, useRef, useState } from 'react'
import { Bell, LogOut, Plus, UserRound, UserRoundPlus } from 'lucide-react'
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
  const profile = useRef<HTMLDetailsElement>(null)
  const guarded = memberRoutes.includes(route) && !flow.account
  const unread = flow.notices.filter(notice => !notice.read).length
  const editing = flow.reports.find(report => report.id === editingId && report.authorId === flow.account?.id && report.status === 'revision')

  useEffect(() => {
    if (previousRoute.current === route) return
    previousRoute.current = route
    if (profile.current) profile.current.open = false
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
      <a className="nav-item nav-icon" href={routes.alerts} aria-current={route === 'alerts' ? 'page' : undefined}
        aria-label={unread ? `Alertas (${unread} não lidos)` : 'Alertas'} title="Alertas">
        <Bell size={19} aria-hidden="true" /> {unread > 0 && <span className="unread-count" aria-hidden="true">{unread > 9 ? '9+' : unread}</span>}
      </a>
      {route !== 'reports' && <Button asChild className="nav-item report-link"><a href={routes.report} aria-label="Registrar ocorrência" aria-current={route === 'report' ? 'page' : undefined} onClick={() => setEditingId(undefined)}>
        <Plus aria-hidden="true" /> <span className="report-link-label">Registrar <span className="report-link-extra">ocorrência</span></span>
      </a></Button>}
    </>}
    <details className="profile-menu" ref={profile} onBlur={event => {
      if (!event.currentTarget.contains(event.relatedTarget)) event.currentTarget.open = false
    }} onKeyDown={event => {
      if (event.key === 'Escape' && event.currentTarget.open) {
        event.stopPropagation()
        event.currentTarget.open = false
        event.currentTarget.querySelector('summary')?.focus()
      }
    }}>
      <summary className="nav-item nav-icon" aria-label="Perfil" title="Perfil"><UserRound size={19} aria-hidden="true" /></summary>
      <div className="profile-options">
        <a className="nav-item" href={routes.signup} onClick={() => { if (profile.current) profile.current.open = false }}>
          <UserRoundPlus size={16} aria-hidden="true" /> Criar conta
        </a>
        <button type="button" className="nav-item" onClick={signOut}><LogOut size={16} aria-hidden="true" /> Sair</button>
      </div>
    </details>
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
    page = <ReportsPage flow={flow} onEdit={editReport} onCreate={() => setEditingId(undefined)} message={message} />
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
        <a className="nav-item" href={routes.map} aria-current={route === 'map' ? 'page' : undefined}>Explorar mapa</a>
        <a className="nav-item" href={routes.about} aria-current={route === 'about' ? 'page' : undefined}>Sobre o projeto</a>
        {flow.account?.role === 'resident' && <a className="nav-item" href={routes.reports} aria-current={route === 'reports' ? 'page' : undefined}>Meus relatos</a>}
        {flow.account?.role === 'moderator' && <a className="nav-item" href={routes.moderation} aria-current={route === 'moderation' ? 'page' : undefined}>Moderação</a>}
      </nav>
      {memberNav ?? <div className="header-account">
        <a className="nav-item" href={routes.login} aria-current={route === 'login' ? 'page' : undefined}>Entrar</a>
        <Button asChild className="nav-item"><a href={routes.signup} aria-current={route === 'signup' ? 'page' : undefined}>Criar conta</a></Button>
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
