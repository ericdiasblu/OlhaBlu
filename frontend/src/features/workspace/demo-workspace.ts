import { useState } from 'react'
import type { Occurrence, OccurrenceType } from '@/features/occurrences/types'

export type Place = { name: string; latitude: number; longitude: number }
export type Account = { id: string; name: string; role: 'resident' | 'moderator' }
export type ReportDraft = { type: OccurrenceType; description: string; place: Place; photo?: File }
export type Outcome = 'pending' | 'published' | 'revision' | 'rejected'
export type Report = ReportDraft & {
  id: string; authorId: string; status: Outcome; createdAt: string; reason?: string
}
export type Complaint = { id: string; occurrence: Occurrence; reason: string; authorId: string; reviewed: boolean }
export type Notice = { id: string; authorId: string; title: string; body: string; time: string; read: boolean }
type Decision = { id: string; report: Report; status: Exclude<Outcome, 'pending'>; reason: string; time: string }

export const places: Place[] = [
  { name: 'Centro', latitude: -26.9218, longitude: -49.0636 },
  { name: 'Victor Konder', latitude: -26.9091, longitude: -49.0762 },
  { name: 'Itoupava Seca', latitude: -26.9018, longitude: -49.071 },
  { name: 'Vila Nova', latitude: -26.9096, longitude: -49.0911 },
  { name: 'Garcia', latitude: -26.9422, longitude: -49.0621 },
  { name: 'Velha', latitude: -26.9183, longitude: -49.1008 },
]

export const demoTypes: OccurrenceType[] = [
  { id: 1, slug: 'alagamento', label: 'Alagamento', icon: 'waves' },
  { id: 2, slug: 'acidente', label: 'Acidente', icon: 'car' },
  { id: 3, slug: 'arvore-caida', label: 'Árvore caída', icon: 'tree' },
  { id: 4, slug: 'incendio', label: 'Incêndio', icon: 'flame' },
  { id: 5, slug: 'deslizamento', label: 'Deslizamento', icon: 'mountain' },
  { id: 6, slug: 'via-danificada', label: 'Via danificada', icon: 'road' },
  { id: 7, slug: 'falta-de-energia', label: 'Falta de energia', icon: 'zap' },
]

export const resident: Account = { id: 'demo-resident', name: 'Morador visitante', role: 'resident' }
export const moderator: Account = { id: 'demo-moderator', name: 'Moderação', role: 'moderator' }

const exampleReports: Report[] = [
  { id: 'exemplo-alagamento', type: demoTypes[0], place: places[0], description: 'Acúmulo de água junto à travessia. A passagem está parcialmente bloqueada.', authorId: 'demo-neighbor', status: 'published', createdAt: new Date().toISOString() },
  { id: 'exemplo-via', type: demoTypes[5], place: places[1], description: 'Um buraco ocupa parte da faixa junto ao cruzamento.', authorId: 'demo-neighbor', status: 'published', createdAt: new Date().toISOString() },
  { id: 'exemplo-arvore', type: demoTypes[2], place: places[2], description: 'Árvore caída sobre a calçada. Ainda há passagem pela via.', authorId: resident.id, status: 'pending', createdAt: new Date().toISOString() },
]

const exampleNotice: Notice = {
  id: 'welcome', authorId: resident.id, title: 'Seu relato está em análise',
  body: 'O relato de árvore caída em Itoupava Seca aguarda a decisão da moderação.',
  time: new Date().toISOString(), read: false,
}

export const outcomes: Record<Outcome, string> = {
  pending: 'Em análise', published: 'Publicado', revision: 'Correção solicitada', rejected: 'Não aprovado',
}

export function matchPlaces(query: string) {
  const normalize = (value: string) => value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
  const aliases: Record<string, string> = { Centro: 'Rua XV de Novembro', 'Victor Konder': 'Rua São Paulo', 'Itoupava Seca': 'Rua Antônio da Veiga' }
  return places.filter(place => normalize(`${place.name} ${aliases[place.name] ?? ''}`).includes(normalize(query.trim())))
}

export function useDemoWorkspace() {
  const [account, signIn] = useState<Account | null>(null)
  const [reports, setReports] = useState(exampleReports)
  const [decisions, setDecisions] = useState<Decision[]>([])
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [notices, setNotices] = useState<Notice[]>([exampleNotice])
  const [preferences, setPreferences] = useState<Record<string, boolean>>({})
  const [pushConsent, setPushConsent] = useState<Record<string, boolean>>({})
  const [contributions, setContributions] = useState<Record<string, { confirmed: string[]; resolved: string[]; lastConfirmed: string | null }>>({})

  function submitReport(draft: ReportDraft, id?: string) {
    if (!account || account.role !== 'resident') return
    if (id) {
      setReports(current => current.map(report => report.id === id && report.authorId === account.id && report.status === 'revision'
        ? { ...report, ...draft, status: 'pending', reason: undefined } : report))
      return
    }
    const report: Report = { ...draft, id: crypto.randomUUID(), authorId: account.id, createdAt: new Date().toISOString(), status: 'pending' }
    setReports(current => [report, ...current])
  }

  function reviewReport(report: Report, status: Exclude<Outcome, 'pending'>, reason: string) {
    if (account?.role !== 'moderator' || report.status !== 'pending') return
    setReports(current => current.map(item => item.id === report.id ? { ...item, status, reason } : item))
    const decision = { id: crypto.randomUUID(), report, status, reason, time: new Date().toISOString() }
    setDecisions(current => [decision, ...current])
    if (preferences[report.authorId] !== false) {
      const notice: Notice = {
        id: crypto.randomUUID(), authorId: report.authorId, title: outcomes[status],
        body: `${report.type.label} em ${report.place.name}. ${reason}`, time: new Date().toISOString(), read: false,
      }
      setNotices(current => [notice, ...current])
    }
  }

  function complain(occurrence: Occurrence, reason: string) {
    if (!account) return
    const complaint: Complaint = {
      id: crypto.randomUUID(), occurrence, reason, authorId: account.id, reviewed: false,
    }
    setComplaints(current => current.some(item => item.authorId === account.id && item.occurrence.id === occurrence.id)
      ? current : [complaint, ...current])
  }

  function reviewComplaint(id: string) {
    if (account?.role === 'moderator') setComplaints(current => current.map(item => item.id === id ? { ...item, reviewed: true } : item))
  }

  function contribute(id: string, kind: 'confirmed' | 'resolved') {
    if (!account) return
    const now = new Date().toISOString()
    setContributions(current => {
      const item = current[id] ?? { confirmed: [], resolved: [], lastConfirmed: null }
      if (item[kind].includes(account.id)) return current
      return {
        ...current, [id]: {
          ...item, [kind]: [...item[kind], account.id],
          lastConfirmed: kind === 'confirmed' ? now : item.lastConfirmed,
        },
      }
    })
  }

  const demoOccurrences: Occurrence[] = reports.filter(report => report.status === 'published').map(report => ({
    id: report.id, occurrence_type: report.type, description: report.description,
    latitude: report.place.latitude, longitude: report.place.longitude,
    status: (contributions[report.id]?.resolved.length ?? 0) >= 2 ? 'resolved' : 'active',
    source: 'community', is_simulated: true, freshness: 'current',
    created_at: report.createdAt, updated_at: contributions[report.id]?.lastConfirmed ?? report.createdAt,
    last_confirmed_at: contributions[report.id]?.lastConfirmed ?? null,
  }))
  const accountId = account?.id
  const ownNotices = notices.filter(notice => notice.authorId === accountId)

  return {
    account, signIn, reports, decisions, submitReport, reviewReport, complaints, complain, reviewComplaint, contribute,
    contributions, demoOccurrences, notices: ownNotices,
    alertsEnabled: accountId ? preferences[accountId] !== false : false,
    setAlertsEnabled(enabled: boolean) {
      if (accountId) setPreferences(current => ({ ...current, [accountId]: enabled }))
    },
    pushEnabled: accountId ? pushConsent[accountId] === true : false,
    setPushEnabled(enabled: boolean) {
      if (accountId) setPushConsent(current => ({ ...current, [accountId]: enabled }))
    },
    markRead(id: string) {
      setNotices(current => current.map(notice => notice.authorId === accountId && notice.id === id ? { ...notice, read: true } : notice))
    },
    markAllRead() {
      setNotices(current => current.map(notice => notice.authorId === accountId ? { ...notice, read: true } : notice))
    },
  }
}

export type Workspace = ReturnType<typeof useDemoWorkspace>
