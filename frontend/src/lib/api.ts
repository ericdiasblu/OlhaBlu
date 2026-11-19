const baseUrl = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '')

export async function apiGet<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, { signal, headers: { Accept: 'application/json' } })
  if (!response.ok) {
    throw new Error(response.status === 503
      ? 'As ocorrências estão indisponíveis no momento. Tente novamente em instantes.'
      : 'Não foi possível consultar as ocorrências. Verifique sua conexão e tente novamente.')
  }
  return response.json() as Promise<T>
}
