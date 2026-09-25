import { useCallback, useRef } from 'react'

/**
 * useThrottle — ensures callback at most once per `limit` ms
 * Use case: throttling Generate clicks / resize handlers
 */
export function useThrottle<T extends (...args: unknown[]) => unknown>(cb: T, limit = 1000) {
  const last = useRef(0)
  const timer = useRef<number | null>(null)
  return useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now()
      const remaining = limit - (now - last.current)
      if (remaining <= 0) {
        if (timer.current) window.clearTimeout(timer.current)
        last.current = now
        cb(...args)
      } else if (timer.current === null) {
        timer.current = window.setTimeout(() => {
          last.current = Date.now()
          timer.current = null
          cb(...args)
        }, remaining)
      }
    },
    [cb, limit]
  )
}
