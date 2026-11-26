import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Check, Flag, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { routes } from '@/app/navigation'
import type { Occurrence } from '@/features/occurrences/types'
import type { Workspace } from '@/features/workspace/demo-workspace'

function ComplaintDialog({ onSubmit, onClose }: { onSubmit: (reason: string) => Promise<void>; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [reason, setReason] = useState('')
  const [invalid, setInvalid] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const element = dialog.current
    element?.showModal()
    return () => element?.close()
  }, [])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!reason.trim()) {
      setInvalid(true)
      return
    }
    setError('')
    setSubmitting(true)
    try {
      await onSubmit(reason.trim())
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível enviar a denúncia.')
    } finally {
      setSubmitting(false)
    }
  }

  return <dialog ref={dialog} className="workspace-dialog" aria-label="Denunciar ocorrência"
    onCancel={event => { event.preventDefault(); onClose() }}>
    <div className="dialog-heading"><h2>Denunciar ocorrência</h2>
      <Button type="button" variant="ghost" size="icon" aria-label="Cancelar denúncia" onClick={onClose}><X /></Button>
    </div>
    <p className="field-hint">Descreva o problema para encaminhar a denúncia à fila de moderação.</p>
    <form className="workspace-form" onSubmit={submit}>
      <label>Motivo<textarea rows={3} maxLength={300} required value={reason}
        onChange={event => { setReason(event.target.value); setInvalid(false) }} /></label>
      {invalid && <p className="form-error" role="alert">Informe o motivo da denúncia.</p>}
      {error && <p className="form-error" role="alert">{error}</p>}
      <Button type="submit" disabled={submitting}>{submitting ? 'Enviando…' : 'Enviar denúncia'}</Button>
    </form>
  </dialog>
}

export function OccurrenceActions({ occurrence, flow, onFeedback, onUpdated }: {
  occurrence: Occurrence
  flow: Workspace
  onFeedback: (message: string) => void
  onUpdated: () => void
}) {
  const [dialog, setDialog] = useState(false)
  const [busy, setBusy] = useState(false)
  const account = flow.account
  if (!account) return <Button asChild variant="outline"><a href={routes.login}>Entrar para contribuir</a></Button>

  const confirmed = Boolean(occurrence.viewer_confirmed)
  const resolved = Boolean(occurrence.viewer_resolved)
  const complained = Boolean(occurrence.viewer_complained)

  async function handleContribute(kind: 'confirmed' | 'resolved', message: string) {
    setBusy(true)
    try {
      await flow.contribute(occurrence.id, kind)
      onFeedback(message)
      onUpdated()
    } catch (cause) {
      onFeedback(cause instanceof Error ? cause.message : 'Não foi possível registrar sua contribuição.')
    } finally {
      setBusy(false)
    }
  }

  return <div className="occurrence-actions">
    <div className="workspace-actions">
      {occurrence.status === 'active' && <>
        <Button type="button" variant="outline" disabled={confirmed || busy}
          onClick={() => void handleContribute('confirmed', 'Confirmação registrada.')}>
          <Check aria-hidden="true" /> {confirmed ? 'Confirmado' : 'Confirmar ocorrência'}
        </Button>
        <Button type="button" variant="ghost" disabled={resolved || busy}
          onClick={() => void handleContribute('resolved', 'Indicação de resolução registrada.')}>
          {resolved ? 'Resolução indicada' : 'Indicar resolução'}
        </Button>
      </>}
      <Button type="button" variant="ghost" disabled={complained || busy} onClick={() => setDialog(true)}>
        <Flag aria-hidden="true" /> {complained ? 'Denúncia enviada' : 'Denunciar'}
      </Button>
    </div>
    {dialog && <ComplaintDialog onClose={() => setDialog(false)} onSubmit={async reason => {
      await flow.complain(occurrence, reason)
      setDialog(false)
      onFeedback('Denúncia enviada para análise.')
      onUpdated()
    }} />}
  </div>
}
