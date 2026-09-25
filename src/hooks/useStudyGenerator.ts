import { useCallback, useRef, useState } from 'react'
import { callGenerate, ApiError } from '../lib/api'
import { parseStudySet, isLikelyTruncated } from '../lib/parse'
import { generateMockStudySet } from '../lib/mock'
import type { StudySet } from '../types'

type Status = 'idle' | 'loading' | 'success' | 'error'

export function useStudyGenerator() {
  const [status, setStatus] = useState<Status>('idle')
  const [study, setStudy] = useState<StudySet | null>(null)
  const [raw, setRaw] = useState('')
  const [error, setError] = useState('')
  const [snippet, setSnippet] = useState('')
  const [warnings, setWarnings] = useState<string[]>([])
  const [elapsed, setElapsed] = useState<number | null>(null)

  const reqIdRef = useRef(0)
  const abortRef = useRef<AbortController | null>(null)

  const generate = useCallback(
    async (input: string, count: number, quizCount: number, difficulty: string) => {
      const text = input.trim()
      if (!text) {
        setError('Please paste some notes or a topic first.')
        setStatus('error')
        return
      }

      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller
      const myId = ++reqIdRef.current

      setStatus('loading')
      setError('')
      setSnippet('')
      setWarnings([])
      setElapsed(null)
      setRaw('')

      const start = Date.now()
      const timeoutId = window.setTimeout(() => controller.abort(), 28000)

      try {
        const data = await callGenerate({ input: text, count, quizCount, difficulty, signal: controller.signal })
        if (myId !== reqIdRef.current) return

        const rawText = data.raw || ''
        setRaw(rawText)
        setElapsed(data.elapsedMs ?? Date.now() - start)

        if (!rawText) throw new Error('Model returned empty response. Try rephrasing.')

        if (isLikelyTruncated(rawText)) {
          setWarnings((w) => [...w, 'Response looks truncated — retry if incomplete.'])
        }

        const parsed = parseStudySet(rawText)
        if (myId !== reqIdRef.current) return

        if (!parsed.ok) {
          setError(parsed.error)
          setSnippet(parsed.snippet || rawText.slice(0, 800))
          setStatus('error')
          return
        }

        setStudy(parsed.data)
        setWarnings(parsed.warnings)
        setStatus('success')
      } catch (e: unknown) {
        if (myId !== reqIdRef.current) return
        const err = e as Error & { status?: number; retryable?: boolean }
        if (err.name === 'AbortError') {
          const wasTimeout = Date.now() - start >= 27000
          setError(wasTimeout ? 'Request timed out — please try again with shorter input.' : 'Request cancelled.')
          setStatus('error')
          return
        }
        let msg = err.message || 'Something went wrong. Please try again.'
        if (err instanceof ApiError) {
          if (err.status === 502) msg = 'Service temporarily unavailable — please try again in a few seconds.'
          if (err.status === 429) msg = 'Too many requests — please wait a moment and try again.'
          if (err.status === 504) msg = 'Request timed out — please try again.'
          // Clean up raw provider message if present
          msg = msg.replace(/Request failed \(502\)[^•]*/i, 'Service temporarily unavailable — please try again.')
        } else if (msg.toLowerCase().includes('failed to fetch')) {
          msg = 'Network error — please check your connection and try again.'
        } else if (msg.toLowerCase().includes('timeout')) {
          msg = 'Request timed out — please try again.'
        }
        setError(msg)
        setSnippet((prev) => prev || text.slice(0, 600))
        setStatus('error')
      } finally {
        window.clearTimeout(timeoutId)
      }
    },
    []
  )

  const cancel = useCallback(() => {
    abortRef.current?.abort()
    setStatus('idle')
  }, [])

  const loadMock = useCallback((input: string, count: number, quizCount = 5) => {
    const mock = generateMockStudySet(input || 'Demo: LearnForge preview deck', count, quizCount)
    setStudy(mock)
    setWarnings(['Demo deck — generated locally so you can explore the interface.'])
    setRaw(JSON.stringify(mock, null, 2))
    setElapsed(0)
    setError('')
    setSnippet('')
    setStatus('success')
  }, [])

  const reset = useCallback(() => {
    setStudy(null)
    setStatus('idle')
    setError('')
    setSnippet('')
    setWarnings([])
    setRaw('')
    setElapsed(null)
  }, [])

  return { status, study, raw, error, snippet, warnings, elapsed, generate, cancel, reset, loadMock, setStudy, setStatus }
}
