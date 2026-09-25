import { useCallback, useState } from 'react'
import type { StudySet } from '../types'

const LS_KEY = 'learnforge:sets'
const LS_LEGACY_KEYS = ['cognideck:sets', 'study-assistant:sets']

export function useLocalStorageSets() {
  const [sets, setSets] = useState<StudySet[]>(() => {
    try {
      const raw = localStorage.getItem(LS_KEY) ?? LS_LEGACY_KEYS.map((k) => localStorage.getItem(k)).find(Boolean)
      return raw ? (JSON.parse(raw) as StudySet[]) : []
    } catch {
      return []
    }
  })

  const save = useCallback((s: StudySet) => {
    setSets((prev) => {
      const next = [s, ...prev.filter((x) => x.topic !== s.topic)].slice(0, 12)
      localStorage.setItem(LS_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const clear = useCallback(() => {
    localStorage.removeItem(LS_KEY)
    LS_LEGACY_KEYS.forEach((k) => localStorage.removeItem(k))
    setSets([])
  }, [])

  return { sets, save, clear }
}
