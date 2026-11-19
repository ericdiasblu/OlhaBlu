import { useCallback, useEffect, useState } from 'react'
import { apiGet } from '@/lib/api'
import type { Bbox, Filters, OccurrencePage, OccurrenceType } from './types'

const emptyPage: OccurrencePage = { items: [], next_cursor: null, has_more: false }

export function useOccurrences(bbox: Bbox, filters: Filters) {
  const [page, setPage] = useState<OccurrencePage>(emptyPage)
  const [types, setTypes] = useState<OccurrenceType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updatedAt, setUpdatedAt] = useState<string | null>(null)
  const [revision, setRevision] = useState(0)
  const bboxKey = bbox.join(',')
  const refresh = useCallback(() => setRevision(value => value + 1), [])

  useEffect(() => {
    let disposed = false
    let controller: AbortController | undefined
    setPage(emptyPage)
    setUpdatedAt(null)
    const load = async () => {
      controller?.abort()
      controller = new AbortController()
      setLoading(true)
      const params = new URLSearchParams({
        bbox: bboxKey, status: filters.status, freshness: filters.freshness, limit: '100',
      })
      if (filters.typeId) params.set('type_id', filters.typeId)
      try {
        const [nextPage, nextTypes] = await Promise.all([
          apiGet<OccurrencePage>(`/occurrences?${params}`, controller.signal),
          apiGet<OccurrenceType[]>('/occurrence-types', controller.signal),
        ])
        if (disposed) return
        setPage(nextPage)
        setTypes(nextTypes)
        setError(null)
        setUpdatedAt(new Date().toISOString())
      } catch (cause) {
        if (disposed || (cause instanceof DOMException && cause.name === 'AbortError')) return
        setPage(emptyPage)
        setUpdatedAt(null)
        setError(cause instanceof Error ? cause.message : 'Não foi possível atualizar a consulta.')
      } finally {
        if (!disposed) setLoading(false)
      }
    }
    const resume = () => {
      if (document.visibilityState === 'visible' && navigator.onLine) void load()
    }
    void load()
    const timer = window.setInterval(resume, 15_000)
    document.addEventListener('visibilitychange', resume)
    window.addEventListener('online', resume)
    return () => {
      disposed = true
      controller?.abort()
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', resume)
      window.removeEventListener('online', resume)
    }
  }, [bboxKey, filters.typeId, filters.status, filters.freshness, revision])

  return { ...page, types, loading, error, updatedAt, refresh }
}
