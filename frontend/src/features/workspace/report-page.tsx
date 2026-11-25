import { lazy, Suspense, useCallback, useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { ArrowLeft, ClipboardCheck, ImagePlus, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FilterSelect } from '@/components/ui/filter-select'
import { routes } from '@/app/navigation'
import { demoTypes, type Place, type Report, type ReportDraft } from './demo-workspace'
import { PlacePicker, WorkspaceHeading } from './workspace-ui'

const maxPhotoSize = 5 * 1024 * 1024
const photoTypes = ['image/jpeg', 'image/png', 'image/webp']
const LocationMap = lazy(() => import('@/features/map/occurrence-map').then(module => ({ default: module.OccurrenceMap })))
const ignoreMapEvent = () => {}

export function PhotoPreview({ photo }: { photo: File }) {
  const [url, setUrl] = useState('')
  useEffect(() => {
    const source = URL.createObjectURL(photo)
    setUrl(source)
    return () => URL.revokeObjectURL(source)
  }, [photo])
  return url ? <img className="report-photo" src={url} alt="Foto anexada ao relato" /> : null
}

export function ReportPage({ previous, onSubmit }: { previous?: Report; onSubmit: (draft: ReportDraft) => void }) {
  const id = useId()
  const [typeId, setTypeId] = useState(previous ? String(previous.type.id) : 'choose')
  const [description, setDescription] = useState(previous?.description ?? '')
  const [place, setPlace] = useState<Place | undefined>(previous?.place)
  const [query, setQuery] = useState('')
  const [photo, setPhoto] = useState(previous?.photo)
  const [error, setError] = useState('')
  const [photoError, setPhotoError] = useState('')
  const [preview, setPreview] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerCenter, setPickerCenter] = useState<Place>()
  const reviewHeading = useRef<HTMLHeadingElement>(null)
  const pickLocation = useCallback((point: Omit<Place, 'name'>) => setPlace({ ...point, name: 'Ponto selecionado no mapa' }), [])
  const type = demoTypes.find(option => String(option.id) === typeId)

  useEffect(() => {
    if (preview) reviewHeading.current?.focus()
  }, [preview])

  function checkForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!type || !place || description.trim().length < 12 || photoError) {
      setError('Escolha um tipo e um bairro, escreva pelo menos 12 caracteres e confira o anexo.')
      return
    }
    setError('')
    setPreview(true)
  }

  return <main className="workspace" id="conteudo">
    <a className="back-link" href={routes.reports}><ArrowLeft size={16} aria-hidden="true" /> Meus relatos</a>
    <WorkspaceHeading title={previous ? 'Corrigir relato' : 'Registrar ocorrência'} description="Indique o local e descreva o que está acontecendo." />
    <div className="workspace-columns">
      <section className="workspace-panel">
        {preview && type && place ? <div className="workspace-form workspace-reveal">
          <h2 ref={reviewHeading} tabIndex={-1}>Revisar relato</h2>
          <dl className="workspace-metadata"><div><dt>Tipo</dt><dd>{type.label}</dd></div><div><dt>Local</dt><dd>{place.name}</dd></div></dl>
          <p className="report-description">{description.trim()}</p>
          {photo && <PhotoPreview photo={photo} />}
          <div className="workspace-actions">
            <Button type="button" onClick={() => onSubmit({ type, description: description.trim(), place, photo })}>Enviar para análise</Button>
            <Button type="button" variant="outline" onClick={() => setPreview(false)}>Voltar e editar</Button>
          </div>
        </div> : <form className="workspace-form" onSubmit={checkForm}>
          {previous?.reason && <p className="workspace-notice">Correção solicitada. {previous.reason}</p>}
          <div className="form-section">
            <h2><MapPin size={19} aria-hidden="true" /> Localização</h2>
            <PlacePicker id={`${id}-place`} query={query} onQuery={setQuery} onChoose={setPlace} selected={place} />
            {import.meta.env.VITE_MAPBOX_TOKEN && <div>
              <Button type="button" variant="outline" aria-expanded={pickerOpen} onClick={() => {
                if (!pickerOpen) setPickerCenter(place)
                setPickerOpen(open => !open)
              }}>{pickerOpen ? 'Fechar mapa de localização' : 'Escolher ponto no mapa'}</Button>
            </div>}
            {pickerOpen && <div className="report-location-picker">
              <p className="field-hint">Toque no mapa para marcar o local da ocorrência. Você também pode selecionar um bairro acima.</p>
              <div className="report-location-map">
                <Suspense fallback={<p className="field-hint" role="status">Abrindo mapa…</p>}>
                  <LocationMap occurrences={[]} selectedId={null} onSelect={ignoreMapEvent}
                    onBoundsChange={ignoreMapEvent} center={pickerCenter} point={place} onPick={pickLocation} />
                </Suspense>
              </div>
            </div>}
            {place && <p className="workspace-notice" role="status">Local selecionado: {place.name}</p>}
          </div>
          <div className="form-section">
            <h2>Informações do relato</h2>
            <FilterSelect id={`${id}-type`} label="Tipo" value={typeId} onChange={setTypeId}
              options={[{ value: 'choose', label: 'Selecione o tipo' }, ...demoTypes.map(item => ({ value: String(item.id), label: item.label }))]} />
            <label>Descrição<textarea value={description} onChange={event => setDescription(event.target.value)}
              required minLength={12} maxLength={500} rows={4} placeholder="Ex. A água cobre parte da faixa perto do cruzamento." /></label>
            <span className="field-hint">{description.length}/500 caracteres</span>
          </div>
          <div className="form-section">
            <h2><ImagePlus size={19} aria-hidden="true" /> Foto opcional</h2>
            <label htmlFor={`${id}-photo`}>Anexar foto</label>
            <input id={`${id}-photo`} type="file" accept={photoTypes.join(',')} onChange={event => {
              const file = event.target.files?.[0]
              if (!file) return
              if (!photoTypes.includes(file.type) || file.size > maxPhotoSize) {
                setPhotoError('Selecione um JPEG, PNG ou WebP de até 5 MB.')
              } else {
                setPhoto(file)
                setPhotoError('')
              }
              event.target.value = ''
            }} />
            {photoError && <p className="form-error" role="alert">{photoError}</p>}
            {photo && <PhotoPreview photo={photo} />}
            {(photo || photoError) && <div><Button variant="ghost" type="button" onClick={() => { setPhoto(undefined); setPhotoError('') }}>Remover anexo</Button></div>}
          </div>
          {error && <p className="form-error" role="alert">{error}</p>}
          <div><Button type="submit">Revisar relato</Button></div>
        </form>}
      </section>
      <aside className="workspace-panel workspace-aside">
        <span className="workspace-icon"><ClipboardCheck size={22} aria-hidden="true" /></span>
        {!preview && <>
          <h2>Resumo do relato</h2>
          <dl className="workspace-metadata">
            <div><dt>Local</dt><dd>{place?.name ?? 'A selecionar'}</dd></div>
            <div><dt>Tipo</dt><dd>{type?.label ?? 'A selecionar'}</dd></div>
            <div><dt>Foto</dt><dd>{photo ? 'Anexada' : 'Sem anexo'}</dd></div>
          </dl>
        </>}
        <h2>O que acontece depois?</h2>
        <p>O relato entra em análise. Você pode acompanhar a decisão e enviar correções em Meus relatos.</p>
        <p className="field-hint">Nesta demonstração, os dados e a foto ficam apenas na sessão atual.</p>
      </aside>
    </div>
  </main>
}
