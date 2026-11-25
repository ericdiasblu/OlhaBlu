import { useState, type FormEvent } from 'react'
import { ArrowLeft, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { routes } from '@/app/navigation'
import { moderator, resident, type Account } from './demo-workspace'
import { WorkspaceHeading } from './workspace-ui'

export function AuthPage({ mode, onSignIn, requiresAccount }: {
  mode: 'login' | 'signup'; onSignIn: (account: Account) => void; requiresAccount?: boolean
}) {
  const signup = mode === 'signup'
  const [visible, setVisible] = useState(false)

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const values = new FormData(event.currentTarget)
    const email = String(values.get('email')).trim().toLowerCase()
    const name = signup ? String(values.get('name')).trim() : 'Morador visitante'
    if (!name) {
      const field = event.currentTarget.elements.namedItem('name') as HTMLInputElement
      field.setCustomValidity('Informe um nome.')
      field.reportValidity()
      return
    }
    onSignIn({ id: `demo:${email}`, name, role: 'resident' })
  }

  return <main className="workspace auth-workspace" id="conteudo">
    <a href={routes.map} className="back-link"><ArrowLeft size={16} aria-hidden="true" /> Voltar ao mapa</a>
    <section className="workspace-panel auth-panel">
      <WorkspaceHeading title={signup ? 'Criar conta' : 'Entrar'} description={requiresAccount
        ? 'Entre para continuar neste fluxo.'
        : signup ? 'Crie uma conta para enviar e acompanhar seus relatos.' : 'Acesse seus relatos e alertas em um só lugar.'} />
      <p className="workspace-notice" role="note">Ambiente de demonstração. Use dados fictícios. As senhas não são enviadas nem armazenadas.</p>
      <form className="workspace-form" onSubmit={submit}>
        {signup && <label>Nome<input name="name" autoComplete="name" maxLength={80} required onInput={event => event.currentTarget.setCustomValidity('')} /></label>}
        <label>E-mail<input name="email" type="email" autoComplete="email" required maxLength={120} placeholder="voce@exemplo.com" /></label>
        <div className="password-field">
          <label htmlFor="demo-password">Senha</label>
          <input id="demo-password" name="password" type={visible ? 'text' : 'password'}
            autoComplete={signup ? 'new-password' : 'current-password'} minLength={8} required aria-describedby="password-hint" />
          <button type="button" aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'} onClick={() => setVisible(value => !value)}>
            {visible ? <EyeOff size={19} /> : <Eye size={19} />}
          </button>
        </div>
        <p id="password-hint" className="field-hint">Use pelo menos 8 caracteres.</p>
        <Button type="submit">{signup ? 'Criar conta' : 'Entrar'}</Button>
      </form>
      <p className="auth-switch">{signup ? 'Já tem conta?' : 'Ainda não tem conta?'} <a href={signup ? routes.login : routes.signup}>{signup ? 'Entrar' : 'Criar conta'}</a></p>
      {!signup && <div className="auth-preview">
        <p>Experimentar com uma conta de demonstração</p>
        <div className="workspace-actions">
          <Button type="button" variant="outline" onClick={() => onSignIn(resident)}>Entrar como morador</Button>
          <Button type="button" variant="ghost" onClick={() => onSignIn(moderator)}>Testar moderação</Button>
        </div>
      </div>}
    </section>
  </main>
}
