export type Bbox = [number, number, number, number]
export type OccurrenceType = { id: number; slug: string; label: string; icon: string }
export type Occurrence = {
  id: string
  occurrence_type: OccurrenceType
  description: string
  latitude: number
  longitude: number
  status: 'active' | 'resolved'
  source: 'community' | 'official'
  is_simulated: boolean
  freshness: 'current' | 'expired'
  created_at: string
  updated_at: string
  last_confirmed_at: string | null
}
export type OccurrencePage = { items: Occurrence[]; next_cursor: string | null; has_more: boolean }
export type Filters = {
  typeId: string
  status: 'active' | 'resolved'
  freshness: 'current' | 'expired' | 'all'
}
