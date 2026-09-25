import { useEffect, useState } from 'react'

/**
 * useDebounce — delays updating value until delay ms have passed without change
 * Use case: input word count / preview, avoids recomputing on every keystroke
 * System design: isolates timing concern from UI
 */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])
  return debounced
}
