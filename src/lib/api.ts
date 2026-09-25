/**
 * api.ts — single place frontend talks to backend (never LLM directly)
 * System design: isolates transport, timeout, and stale-guard concerns
 */

export type GenerateParams = {
  input: string
  count?: number
  quizCount?: number
  difficulty?: string
  signal?: AbortSignal
}

export type GenerateResponse = {
  raw: string
  model?: string
  elapsedMs?: number
  attempted?: Array<{ model: string; status: number | string }>
}

export class ApiError extends Error {
  status: number
  retryable?: boolean
  rawBody?: unknown
  constructor(message: string, status: number, retryable?: boolean, rawBody?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.retryable = retryable
    this.rawBody = rawBody
  }
}

export async function callGenerate({ input, count, quizCount, difficulty, signal }: GenerateParams): Promise<GenerateResponse> {
  const res = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ input, count, quizCount, difficulty }),
    signal,
  })

  const data = (await res.json().catch(() => ({} as Record<string, unknown>))) as Record<string, unknown> & {
    error?: string
    raw?: unknown
    retryable?: boolean
  }

  if (!res.ok) {
    const msg = data?.error || `Request failed (${res.status}) — ${res.statusText || 'check server logs or /api/health'}`
    throw new ApiError(msg, res.status, Boolean(data?.retryable), data)
  }

  if (!data || typeof data.raw !== 'string') {
    throw new ApiError('Invalid server response: missing "raw" JSON string — server may be misconfigured.', res.status, false, data)
  }

  return data as GenerateResponse
}
