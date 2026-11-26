import { useState, type FormEvent } from 'react'
import { ArrowLeft, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { routes } from '@/app/navigation'
import type { Account, Workspace } from './demo-workspace'
import { WorkspaceHeading } from './workspace-ui'

export function AuthPage({ mode, flow, onSignIn, requiresAccount }: {
  mode: 'login' | 'signup'
  flow: Workspace
  onSignIn: (account: Account) => void
  requiresAccount?: boolean
}) {
  const signup = mode === 'signup'
  const [visible, setVisible] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const values = new FormData(event.currentTarget)
    const email = String(values.get('email') ?? '').trim().toLowerCase()
    const password = String(values.get('password') ?? '')
    const name = signup ? String(values.get('name') ?? '').trim() : ''
    if (signup && name.length < 2) {
      const field = event.currentTarget.elements.namedItem('name') as HTMLInputElement
      field.setCustomValidity('Informe um nome com pelo menos 2 caracteres.')
      field.reportValidity()
      return
    }
    setError('')
    setSubmitting(true)
    try {
      const account = signup
        ? await flow.register(name, email, password)
        : await flow.login(email, password)
      onSignIn(account)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível concluir o acesso.')
    } finally {
      setSubmitting(false)
    }
  }

  return <main className="workspace auth-workspace" id="conteudo">
    <a href={routes.map} className="back-link"><ArrowLeft size={16} aria-hidden="true" /> Voltar ao mapa</a>
    <section className="workspace-panel auth-panel">
      <WorkspaceHeading title={signup ? 'Criar conta' : 'Entrar'} description={requiresAccount
        ? 'Entre para continuar neste fluxo.'
        : signup ? 'Crie uma conta para enviar e acompanhar seus relatos.' : 'Acesse seus relatos e alertas em um só lugar.'} />
      <form className="workspace-form" onSubmit={submit}>
        {signup && <label>Nome<input name="name" autoComplete="name" minLength={2} maxLength={120} required onInput={event => event.currentTarget.setCustomValidity('')} /></label>}
        <label>E-mail<input name="email" type="email" autoComplete="email" required maxLength={254} placeholder="voce@exemplo.com" /></label>
        <div className="password-field">
          <label htmlFor="auth-password">Senha</label>
          <input id="auth-password" name="password" type={visible ? 'text' : 'password'}
            autoComplete={signup ? 'new-password' : 'current-password'} minLength={8} required aria-describedby="password-hint" />
          <button type="button" aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'} onClick={() => setVisible(value => !value)}>
            {visible ? <EyeOff size={19} /> : <Eye size={19} />}
          </button>
        </div>
        <p id="password-hint" className="field-hint">Use pelo menos 8 caracteres.</p>
        {error && <p className="form-error" role="alert">{error}</p>}
        <Button type="submit" disabled={submitting}>
          {submitting ? (signup ? 'Criando conta…' : 'Entrando…') : (signup ? 'Criar conta' : 'Entrar')}
        </Button>
      </form>
      <p className="auth-switch">{signup ? 'Já tem conta?' : 'Ainda não tem conta?'} <a href={signup ? routes.login : routes.signup}>{signup ? 'Entrar' : 'Criar conta'}</a></p>
    </section>
  </main>
}
