import { useEffect, useRef, useState } from 'react'
import { Bell, LogOut, Moon, Plus, Sun, UserRound } from 'lucide-react'
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
  const [editingId, setEditingId] = useState<string>()
  const [message, setMessage] = useState<string>()
  const [hasVisitedMap, setHasVisitedMap] = useState(route === 'map')
  const [darkTheme, setDarkTheme] = useState(() => document.documentElement.dataset.theme === 'dark')
  const previousRoute = useRef(route)
  const profile = useRef<HTMLDetailsElement>(null)
  const guarded = flow.authReady && memberRoutes.includes(route) && !flow.account
  const unread = flow.notices.filter(notice => !notice.read).length
  const editing = flow.reports.find(report => report.id === editingId && report.status === 'revision')

  useEffect(() => {
    const theme = darkTheme ? 'dark' : 'light'
    document.documentElement.dataset.theme = theme
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', darkTheme ? '#0d0d0e' : '#f6f9fe')
    try { localStorage.setItem('olhablu-theme', theme) } catch { /* Tema disponível nesta sessão. */ }
  }, [darkTheme])

  useEffect(() => {
    if (previousRoute.current === route) return
    previousRoute.current = route
    if (profile.current) profile.current.open = false
    if (route === 'map') setHasVisitedMap(true)
    window.scrollTo(0, 0)
    document.getElementById(route === 'map' ? 'occurrences-title' : 'workspace-title')?.focus({ preventScroll: true })
  }, [route])

  function signIn(account: Account) {
    if (account.role === 'moderator') navigate('moderation')
    else if (!guarded || route === 'moderation') navigate('map')
  }

  async function signOut() {
    await flow.logout()
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
    <a className="nav-item nav-icon notification-link" href={routes.alerts} aria-current={route === 'alerts' ? 'page' : undefined}
      aria-label={unread ? `Alertas (${unread} ${unread === 1 ? 'não lido' : 'não lidos'})` : 'Alertas'} title="Alertas">
      <Bell size={20} strokeWidth={1.75} aria-hidden="true" /> {unread > 0 && <span className="unread-count" aria-hidden="true">{unread > 9 ? '9+' : unread}</span>}
    </a>
    <details className="profile-menu" ref={profile} onBlur={event => {
      if (!event.currentTarget.contains(event.relatedTarget)) event.currentTarget.open = false
    }} onKeyDown={event => {
      if (event.key === 'Escape' && event.currentTarget.open) {
        event.stopPropagation()
        event.currentTarget.open = false
        event.currentTarget.querySelector('summary')?.focus()
      }
    }}>
      <summary className="nav-item profile-trigger" aria-label={`Perfil de ${flow.account.name}`} title={`${flow.account.name} (${flow.account.email})`}>
        <UserRound size={19} aria-hidden="true" />
        <span className="profile-name">{flow.account.name.split(/\s+/)[0]}</span>
      </summary>
      <div className="profile-options">
        <div className="profile-identity">
          <strong>{flow.account.name}</strong>
          <span>{flow.account.email}</span>
          <span className="profile-role">
            {flow.account.is_primary_admin ? 'Administrador principal' : flow.account.role === 'moderator' ? 'Administrador' : 'Morador'}
          </span>
        </div>
        <button type="button" className="nav-item theme-toggle" role="switch" aria-checked={darkTheme}
          onClick={() => setDarkTheme(enabled => !enabled)}>
          <Moon size={16} aria-hidden="true" /> Modo escuro <span className="theme-switch" aria-hidden="true" />
        </button>
        <button type="button" className="nav-item" onClick={() => void signOut()}><LogOut size={16} aria-hidden="true" /> Sair</button>
      </div>
    </details>
  </nav>

  let page
  if (!flow.authReady && memberRoutes.includes(route)) {
    page = <main id="conteudo" className="workspace">
      <WorkspaceHeading title="Carregando…" description="Verificando sua sessão." />
    </main>
  } else if (route === 'login' || route === 'signup' || guarded) {
    page = <AuthPage key={route} mode={route === 'signup' ? 'signup' : 'login'} flow={flow} onSignIn={signIn} requiresAccount={guarded} />
  } else if (route === 'report' && flow.account) {
    page = <ReportPage key={editing?.id ?? 'new'} previous={editing} types={flow.types} onSubmit={async draft => {
      await flow.submitReport(draft, editing?.id)
      setEditingId(undefined)
      setMessage(editing ? 'Correção enviada para análise.' : 'Relato enviado para análise.')
      navigate('reports')
    }} />
  } else if (route === 'reports' && flow.account) {
    page = <ReportsPage flow={flow} onEdit={editReport} onCreate={() => setEditingId(undefined)} message={message} />
  } else if (route === 'moderation' && flow.account?.role === 'moderator') {
    page = <ModerationPage flow={flow} />
  } else if (route === 'alerts' && flow.account) {
    page = <AlertsPage flow={flow} />
  } else if (route === 'about') {
    page = <main id="conteudo" className="workspace">
      <WorkspaceHeading title="Sobre" description="Um mapa colaborativo de ocorrências urbanas em Blumenau." />
      <section className="workspace-panel workspace-aside">
        <h2>Como funciona</h2>
        <p>Qualquer pessoa pode consultar as ocorrências publicadas. Quem tem conta pode enviar relatos, confirmar informações e encaminhar denúncias.</p>
        <p>Relatos em análise só são visíveis para quem enviou e para a moderação. O mapa ajuda na consulta e não substitui as orientações dos órgãos responsáveis.</p>
        <h2>O que acontece depois de enviar um relato?</h2>
        <p>O relato entra em análise. Em Meus relatos, você pode acompanhar a decisão e enviar uma correção se a moderação solicitar.</p>
        <p>Os limites do município e os bairros vêm do <a href="https://geo.blumenau.sc.gov.br/">GEO Blumenau</a>.</p>
        <Button asChild variant="outline"><a href={routes.map}>Explorar mapa</a></Button>
      </section>
    </main>
  } else if (route !== 'map') {
    page = <main id="conteudo" className="workspace">
      <WorkspaceHeading title="Área restrita" description="Este fluxo está reservado ao perfil correspondente."
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
        {flow.account && <a className="nav-item" href={routes.reports} aria-current={route === 'reports' ? 'page' : undefined}>Meus relatos</a>}
        {flow.account?.role === 'moderator' && <a className="nav-item" href={routes.moderation} aria-current={route === 'moderation' ? 'page' : undefined}>Moderação</a>}
        <a className="nav-item" href={routes.about} aria-current={route === 'about' ? 'page' : undefined}>Sobre</a>
      </nav>
      {memberNav ?? <div className="header-account">
        <button type="button" className="nav-item nav-icon guest-theme-toggle" role="switch" aria-label="Modo escuro"
          aria-checked={darkTheme} title={darkTheme ? 'Ativar modo claro' : 'Ativar modo escuro'} onClick={() => setDarkTheme(enabled => !enabled)}>
          {darkTheme ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
        </button>
        <a className="nav-item" href={routes.login} aria-current={route === 'login' ? 'page' : undefined}>Entrar</a>
        <Button asChild className="nav-item"><a href={routes.signup} aria-current={route === 'signup' ? 'page' : undefined}>Criar conta</a></Button>
      </div>}
    </header>
    {(route === 'map' || hasVisitedMap) && <div hidden={route !== 'map'}>
      <MapPage flow={flow} active={route === 'map'} />
    </div>}
    {page}
    {route === 'map' && flow.account && <a className="map-report-action" href={routes.report}
      aria-label="Registrar ocorrência" title="Registrar ocorrência" onClick={() => setEditingId(undefined)}>
      <Plus size={25} aria-hidden="true" />
    </a>}
  </div>
}
