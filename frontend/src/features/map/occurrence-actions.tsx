import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Check, Flag, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { routes } from '@/app/navigation'
import type { Occurrence } from '@/features/occurrences/types'
import type { Workspace } from '@/features/workspace/demo-workspace'

function ComplaintDialog({ onSubmit, onClose }: { onSubmit: (reason: string) => void; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [reason, setReason] = useState('')
  const [invalid, setInvalid] = useState(false)

  useEffect(() => {
    const element = dialog.current
    element?.showModal()
    return () => element?.close()
  }, [])

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!reason.trim()) {
      setInvalid(true)
      return
    }
    onSubmit(reason.trim())
  }

  return <dialog ref={dialog} className="workspace-dialog" aria-label="Denunciar ocorrência"
    onCancel={event => { event.preventDefault(); onClose() }}>
    <div className="dialog-heading"><h2>Denunciar ocorrência</h2>
      <Button type="button" variant="ghost" size="icon" aria-label="Cancelar denúncia" onClick={onClose}><X /></Button>
    </div>
    <p className="field-hint">Descreva o problema para encaminhar a denúncia à fila de demonstração.</p>
    <form className="workspace-form" onSubmit={submit}>
      <label>Motivo<textarea rows={3} maxLength={300} required value={reason}
        onChange={event => { setReason(event.target.value); setInvalid(false) }} /></label>
      {invalid && <p className="form-error" role="alert">Informe o motivo da denúncia.</p>}
      <Button type="submit">Enviar denúncia</Button>
    </form>
  </dialog>
}

export function OccurrenceActions({ occurrence, flow, onFeedback }: {
  occurrence: Occurrence; flow: Workspace; onFeedback: (message: string) => void
}) {
  const [dialog, setDialog] = useState(false)
  const account = flow.account
  if (!account) return <Button asChild variant="outline"><a href={routes.login}>Entrar para contribuir</a></Button>

  const contribution = flow.contributions[occurrence.id]
  const confirmed = contribution?.confirmed.includes(account.id)
  const resolved = contribution?.resolved.includes(account.id)
  const complained = flow.complaints.some(item => item.occurrence.id === occurrence.id && item.authorId === account.id)
  return <div className="occurrence-actions">
    <p className="field-hint">Contribuições de demonstração</p>
    <div className="workspace-actions">
      {occurrence.status === 'active' && <>
        <Button type="button" variant="outline" disabled={confirmed} onClick={() => {
          flow.contribute(occurrence.id, 'confirmed')
          onFeedback('Confirmação registrada nesta sessão.')
        }}><Check aria-hidden="true" /> {confirmed ? 'Confirmado' : 'Confirmar ocorrência'}</Button>
        <Button type="button" variant="ghost" disabled={resolved} onClick={() => {
          flow.contribute(occurrence.id, 'resolved')
          onFeedback('Indicação de resolução registrada.')
        }}>{resolved ? 'Resolução indicada' : 'Indicar resolução'}</Button>
      </>}
      <Button type="button" variant="ghost" disabled={complained} onClick={() => setDialog(true)}>
        <Flag aria-hidden="true" /> {complained ? 'Denúncia enviada' : 'Denunciar'}
      </Button>
    </div>
    {dialog && <ComplaintDialog onClose={() => setDialog(false)} onSubmit={reason => {
      flow.complain(occurrence, reason)
      setDialog(false)
      onFeedback('Denúncia enviada para análise.')
    }} />}
  </div>
}
