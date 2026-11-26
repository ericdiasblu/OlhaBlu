const baseUrl = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '')

export function apiUrl(path: string): string {
  return `${baseUrl}${path}`
}

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function parseErrorMessage(response: Response): Promise<string> {
  try {
    const payload = await response.json() as { detail?: string | Array<{ msg?: string }> }
    if (typeof payload.detail === 'string' && payload.detail.trim()) return payload.detail
    if (Array.isArray(payload.detail) && payload.detail[0]?.msg) return payload.detail[0].msg
  } catch {
    /* Resposta sem corpo JSON. */
  }
  if (response.status === 503) {
    return 'As ocorrências estão indisponíveis no momento. Tente novamente em instantes.'
  }
  if (response.status === 401) return 'Sua sessão expirou. Entre novamente para continuar.'
  if (response.status === 403) return 'Você não tem permissão para realizar esta ação.'
  return 'Não foi possível concluir a solicitação. Verifique sua conexão e tente novamente.'
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)
  headers.set('Accept', 'application/json')
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  const response = await fetch(apiUrl(path), {
    ...init,
    credentials: 'include',
    headers,
  })
  if (!response.ok) {
    throw new ApiError(response.status, await parseErrorMessage(response))
  }
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

export function apiGet<T>(path: string, signal?: AbortSignal): Promise<T> {
  return request<T>(path, { method: 'GET', signal })
}

export function apiPost<T>(path: string, body?: unknown): Promise<T> {
  return request<T>(path, {
    method: 'POST',
    body: body === undefined ? undefined : JSON.stringify(body),
  })
}

export function apiPut<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
}

export function apiPatch<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
}
