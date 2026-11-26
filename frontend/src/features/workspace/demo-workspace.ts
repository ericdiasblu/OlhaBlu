import { useCallback, useEffect, useState } from 'react'
import { apiDelete, apiGet, apiPatch, apiPost, apiPut, ApiError } from '@/lib/api'
import type { Place } from '@/features/location/blumenau'
import type { Occurrence, OccurrenceType } from '@/features/occurrences/types'

export type Account = {
  id: string
  name: string
  email: string
  role: 'resident' | 'moderator'
  is_primary_admin?: boolean
}
export type ModeratorAccount = {
  id: string
  name: string
  email: string
  isPrimary: boolean
  createdAt: string
}
export type ReportDraft = {
  type: OccurrenceType
  description: string
  place: Place
  photo?: File
  removePhoto?: boolean
}
export type Outcome = 'pending' | 'published' | 'revision' | 'rejected'
export type Report = {
  id: string
  type: OccurrenceType
  description: string
  place: Place
  status: Outcome
  createdAt: string
  reason?: string
  hasPhoto: boolean
}
export type Complaint = {
  id: string
  occurrence: Occurrence
  reason: string
  reviewed: boolean
  createdAt: string
}
export type Notice = {
  id: string
  title: string
  body: string
  time: string
  read: boolean
}
export type Decision = {
  id: string
  report: Report
  status: Exclude<Outcome, 'pending'>
  reason: string
  time: string
}

export const demoTypes: OccurrenceType[] = [
  { id: 1, slug: 'alagamento', label: 'Alagamento', icon: 'waves' },
  { id: 2, slug: 'acidente', label: 'Acidente', icon: 'car' },
  { id: 3, slug: 'arvore-caida', label: 'Árvore caída', icon: 'tree' },
  { id: 4, slug: 'incendio', label: 'Incêndio', icon: 'flame' },
  { id: 5, slug: 'deslizamento', label: 'Deslizamento', icon: 'mountain' },
  { id: 6, slug: 'via-danificada', label: 'Via danificada', icon: 'road' },
  { id: 7, slug: 'falta-de-energia', label: 'Falta de energia', icon: 'zap' },
]

export const outcomes: Record<Outcome, string> = {
  pending: 'Em análise',
  published: 'Publicado',
  revision: 'Correção solicitada',
  rejected: 'Não aprovado',
}

type ApiReport = {
  id: string
  occurrence_type: OccurrenceType
  description: string
  place_name: string
  latitude: number
  longitude: number
  status: Outcome
  reason: string | null
  has_photo: boolean
  created_at: string
  updated_at: string
}

type ApiComplaint = {
  id: string
  occurrence: Occurrence
  reason: string
  reviewed: boolean
  created_at: string
}

type ApiDecision = {
  id: string
  report: ApiReport
  status: Exclude<Outcome, 'pending'>
  reason: string
  created_at: string
}

type ApiModerator = {
  id: string
  name: string
  email: string
  is_primary: boolean
  created_at: string
}

type ApiModerationQueue = {
  pending_reports: ApiReport[]
  pending_complaints: ApiComplaint[]
  decisions: ApiDecision[]
  reviewed_complaints: ApiComplaint[]
  active_occurrences: Occurrence[]
  moderators: ApiModerator[]
}

type ApiAlertsResponse = {
  items: Array<{ id: string; title: string; body: string; read: boolean; created_at: string }>
  alerts_enabled: boolean
  push_enabled: boolean
}

function mapReport(raw: ApiReport): Report {
  return {
    id: raw.id,
    type: raw.occurrence_type,
    description: raw.description,
    place: { name: raw.place_name, latitude: raw.latitude, longitude: raw.longitude },
    status: raw.status,
    createdAt: raw.created_at,
    reason: raw.reason ?? undefined,
    hasPhoto: raw.has_photo,
  }
}

function mapComplaint(raw: ApiComplaint): Complaint {
  return {
    id: raw.id,
    occurrence: raw.occurrence,
    reason: raw.reason,
    reviewed: raw.reviewed,
    createdAt: raw.created_at,
  }
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(new Error('Não foi possível ler o arquivo de foto.'))
    reader.readAsDataURL(file)
  })
}

export function useDemoWorkspace() {
  const [account, setAccount] = useState<Account | null>(null)
  const [authReady, setAuthReady] = useState(false)
  const [types, setTypes] = useState<OccurrenceType[]>(demoTypes)
  const [reports, setReports] = useState<Report[]>([])
  const [pendingReports, setPendingReports] = useState<Report[]>([])
  const [activeOccurrences, setActiveOccurrences] = useState<Occurrence[]>([])
  const [moderators, setModerators] = useState<ModeratorAccount[]>([])
  const [decisions, setDecisions] = useState<Decision[]>([])
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [notices, setNotices] = useState<Notice[]>([])
  const [alertsEnabled, setAlertsEnabledState] = useState(true)
  const [pushEnabled, setPushEnabledState] = useState(false)

  const refreshResidentData = useCallback(async () => {
    const [myReports, alertsData] = await Promise.all([
      apiGet<ApiReport[]>('/me/occurrences'),
      apiGet<ApiAlertsResponse>('/me/alerts'),
    ])
    setReports(myReports.map(mapReport))
    setNotices(alertsData.items.map(item => ({
      id: item.id,
      title: item.title,
      body: item.body,
      time: item.created_at,
      read: item.read,
    })))
    setAlertsEnabledState(alertsData.alerts_enabled)
    setPushEnabledState(alertsData.push_enabled)
  }, [])

  const refreshModerationData = useCallback(async () => {
    const queue = await apiGet<ApiModerationQueue>('/moderation/queue')
    setPendingReports(queue.pending_reports.map(mapReport))
    setActiveOccurrences(queue.active_occurrences ?? [])
    setModerators((queue.moderators ?? []).map(item => ({
      id: item.id,
      name: item.name,
      email: item.email,
      isPrimary: item.is_primary,
      createdAt: item.created_at,
    })))
    setComplaints([
      ...queue.pending_complaints.map(mapComplaint),
      ...queue.reviewed_complaints.map(mapComplaint),
    ])
    setDecisions(queue.decisions.map(item => ({
      id: item.id,
      report: mapReport(item.report),
      status: item.status,
      reason: item.reason,
      time: item.created_at,
    })))
  }, [])

  useEffect(() => {
    let active = true
    void (async () => {
      try {
        const fetchedTypes = await apiGet<OccurrenceType[]>('/occurrence-types')
        if (active && fetchedTypes.length) setTypes(fetchedTypes)
      } catch {
        /* Mantém catálogo padrão enquanto a API não responde. */
      }
      try {
        const session = await apiGet<{ user: Account }>('/auth/me')
        if (active) setAccount(session.user)
      } catch {
        if (active) setAccount(null)
      } finally {
        if (active) setAuthReady(true)
      }
    })()
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (!account) {
      setReports([])
      setPendingReports([])
      setActiveOccurrences([])
      setModerators([])
      setDecisions([])
      setComplaints([])
      setNotices([])
      return
    }
    void refreshResidentData().catch(() => {})
    if (account.role === 'moderator') {
      void refreshModerationData().catch(() => {})
    }
  }, [account, refreshModerationData, refreshResidentData])

  async function register(name: string, email: string, password: string): Promise<Account> {
    const response = await apiPost<{ user: Account }>('/auth/register', { name, email, password })
    setAccount(response.user)
    return response.user
  }

  async function login(email: string, password: string): Promise<Account> {
    const response = await apiPost<{ user: Account }>('/auth/login', { email, password })
    setAccount(response.user)
    return response.user
  }

  async function logout(): Promise<void> {
    try {
      await apiPost('/auth/logout')
    } catch (error) {
      if (!(error instanceof ApiError && error.status === 401)) {
        /* Limpa estado local mesmo em caso de queda de rede. */
      }
    }
    setAccount(null)
  }

  async function submitReport(draft: ReportDraft, id?: string): Promise<void> {
    let photo_base64: string | undefined
    let photo_content_type: string | undefined
    if (draft.photo) {
      photo_base64 = await fileToBase64(draft.photo)
      photo_content_type = draft.photo.type
    }
    const body = {
      type_id: draft.type.id,
      description: draft.description,
      place_name: draft.place.name,
      latitude: draft.place.latitude,
      longitude: draft.place.longitude,
      photo_base64,
      photo_content_type,
      ...(id ? { remove_photo: Boolean(draft.removePhoto) } : {}),
    }
    if (id) {
      await apiPut<ApiReport>(`/me/occurrences/${id}`, body)
    } else {
      await apiPost<ApiReport>('/occurrences', body)
    }
    await refreshResidentData()
    if (account?.role === 'moderator') {
      await refreshModerationData()
    }
  }

  async function reviewReport(
    report: Report,
    status: Exclude<Outcome, 'pending'>,
    reason: string,
  ): Promise<void> {
    await apiPost(`/moderation/occurrences/${report.id}/review`, { decision: status, reason })
    await refreshModerationData()
  }

  async function complain(occurrence: Occurrence, reason: string): Promise<void> {
    await apiPost(`/occurrences/${occurrence.id}/complaints`, { reason })
  }

  async function reviewComplaint(id: string): Promise<void> {
    await apiPost(`/moderation/complaints/${id}/review`)
    await refreshModerationData()
  }

  async function decideResolution(
    occurrenceId: string,
    decision: 'resolve' | 'keep_active',
    reason?: string,
  ): Promise<void> {
    await apiPost(`/moderation/occurrences/${occurrenceId}/resolution`, { decision, reason })
    await refreshModerationData()
  }

  async function addModerator(email: string): Promise<void> {
    await apiPost('/moderation/moderators', { email })
    await refreshModerationData()
  }

  async function removeModerator(userId: string): Promise<void> {
    await apiDelete(`/moderation/moderators/${userId}`)
    await refreshModerationData()
  }

  async function updateOccurrenceLocation(
    occurrenceId: string,
    latitude: number,
    longitude: number,
    placeName?: string,
  ): Promise<void> {
    await apiPatch(`/moderation/occurrences/${occurrenceId}/location`, {
      latitude,
      longitude,
      ...(placeName ? { place_name: placeName } : {}),
    })
  }

  async function contribute(id: string, kind: 'confirmed' | 'resolved'): Promise<void> {
    await apiPost(`/occurrences/${id}/contributions`, { kind })
  }

  async function setAlertsEnabled(enabled: boolean): Promise<void> {
    setAlertsEnabledState(enabled)
    try {
      await apiPatch('/me/preferences', { alerts_enabled: enabled })
    } catch {
      setAlertsEnabledState(!enabled)
    }
  }

  async function setPushEnabled(enabled: boolean): Promise<void> {
    setPushEnabledState(enabled)
    try {
      await apiPatch('/me/preferences', { push_enabled: enabled })
    } catch {
      setPushEnabledState(!enabled)
    }
  }

  async function markRead(id: string): Promise<void> {
    setNotices(current => current.map(notice => notice.id === id ? { ...notice, read: true } : notice))
    await apiPost(`/me/alerts/${id}/read`).catch(() => {})
  }

  async function markAllRead(): Promise<void> {
    setNotices(current => current.map(notice => ({ ...notice, read: true })))
    await apiPost('/me/alerts/read-all').catch(() => {})
  }

  return {
    account,
    authReady,
    types,
    register,
    login,
    logout,
    reports,
    pendingReports,
    activeOccurrences,
    moderators,
    decisions,
    complaints,
    notices,
    alertsEnabled,
    pushEnabled,
    submitReport,
    reviewReport,
    complain,
    reviewComplaint,
    decideResolution,
    addModerator,
    removeModerator,
    updateOccurrenceLocation,
    contribute,
    setAlertsEnabled,
    setPushEnabled,
    markRead,
    markAllRead,
    refreshResidentData,
    refreshModerationData,
  }
}

export type Workspace = ReturnType<typeof useDemoWorkspace>
