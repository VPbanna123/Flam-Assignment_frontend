import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import Header from './components/Header'
import PromptInput from './components/PromptInput'
import LoadingState from './components/LoadingState'
import ErrorState from './components/ErrorState'
import EmptyState from './components/EmptyState'
import { useStudyGenerator } from './hooks/useStudyGenerator'
import { useLocalStorageSets } from './hooks/useLocalStorageSets'
import { useThrottle } from './hooks/useThrottle'

// Lazy load heavy result view — demonstrates code splitting / lazy loading
const ResultView = lazy(() => import('./components/ResultView'))

export default function App() {
  const [input, setInput] = useState('')
  const [count, setCount] = useState(6)
  const [quizCount, setQuizCount] = useState(5)
  const [difficulty, setDifficulty] = useState('mixed')
  const [dark, setDark] = useState(() => {
    if (typeof window === 'undefined') return false
    const saved = localStorage.getItem('theme')
    if (saved === 'dark') return true
    if (saved === 'light') return false
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  const { status, study, raw, error, snippet, warnings, elapsed, generate, cancel, loadMock, setStudy, setStatus } = useStudyGenerator()
  const { sets: savedSets, save: saveSet, clear: clearSaved } = useLocalStorageSets()

  // System design: throttle generate to avoid rapid double-clicks (1s window)
  const throttledGenerate = useThrottle(() => {
    generate(input, count, quizCount, difficulty)
  }, 1000)

  const handleGenerate = useCallback(() => {
    throttledGenerate()
  }, [throttledGenerate])

  // Dark mode — sync to html class (supports Tailwind dark: via .dark)
  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', dark)
    localStorage.setItem('theme', dark ? 'dark' : 'light')
    // set color-scheme for native controls
    root.style.colorScheme = dark ? 'dark' : 'light'
  }, [dark])

  // Listen to system changes only if user hasn't manually chosen
  useEffect(() => {
    const mql = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem('theme')) setDark(e.matches)
    }
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [])

  const savedTopics = savedSets.map((s) => ({ topic: s.topic, cards: s.flashcards.length, quiz: s.quiz.length }))

  return (
    <div className="min-h-dvh flex flex-col bg-(--bg) text-(--text) antialiased">
      <Header dark={dark} onToggle={() => setDark((v) => !v)} />

      {/* Hero — clean, professional */}
      <div className="max-w-[1120px] mx-auto w-full px-5 max-sm:px-4 pt-8 pb-2">
        <div className="max-w-[64ch]">
          <h1 className="m-0 text-[clamp(28px,4.2vw,40px)] font-black tracking-[-0.03em] leading-[0.95]">
            Turn any notes into{' '}
            <span className="bg-linear-to-r from-(--accent) via-(--accent-2) to-(--accent) bg-clip-text text-transparent">
              study tools.
            </span>
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-(--muted) max-w-[58ch]">
            Paste your notes or a topic — get flashcards and a quiz you can work through right away.
          </p>
        </div>
      </div>

      <div className="max-w-[1120px] mx-auto w-full px-5 max-sm:px-4 flex-1 py-5 pb-10 grid gap-5 lg:grid-cols-[400px_1fr] items-start">
        {/* LEFT: input — sticky on desktop */}
        <div className="lg:sticky lg:top-[72px]">
          <PromptInput
            input={input}
            onChange={setInput}
            count={count}
            onCount={setCount}
            quizCount={quizCount}
            onQuizCount={setQuizCount}
            difficulty={difficulty}
            onDifficulty={setDifficulty}
            onGenerate={handleGenerate}
            onCancel={cancel}
            status={status}
            savedTopics={savedTopics}
            onLoadSaved={(topic) => {
              const found = savedSets.find((s) => s.topic === topic)
              if (found) {
                setStudy(found)
                setStatus('success')
              }
            }}
            savedCount={savedSets.length}
            onClearSaved={clearSaved}
          />
        </div>

        {/* RIGHT: output */}
        <div className="bg-(--bg2) border border-(--border) rounded-2xl shadow-(--shadow) overflow-hidden min-h-[540px] flex flex-col backdrop-blur-sm">
          <div className="px-4 py-3.5 border-b border-(--border) flex items-center justify-between gap-3 bg-[color-mix(in_srgb,var(--bg2)_88%,var(--accent-bg))] sticky top-0 z-[1]">
            <div className="min-w-0 flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-xl grid place-items-center shrink-0 border text-sm transition ${
                  status === 'success'
                    ? 'bg-(--success-bg) border-[color-mix(in_srgb,var(--success)_22%,transparent)]'
                    : status === 'error'
                      ? 'bg-(--danger-bg) border-[color-mix(in_srgb,var(--danger)_22%,transparent)]'
                      : status === 'loading'
                        ? 'bg-(--accent-bg) border-(--accent-border) animate-pulse'
                        : 'bg-(--bg) border-(--border)'
                }`}
              >
                {status === 'success' ? '✓' : status === 'error' ? '!' : status === 'loading' ? '◐' : '✦'}
              </div>
              <div className="min-w-0">
                <h2 className="m-0 text-sm font-bold tracking-tight truncate">
                  {status === 'success' && study ? study.topic : status === 'loading' ? 'Generating study set…' : status === 'error' ? 'Generation failed' : 'Your study set'}
                </h2>
                <p className="m-0 text-xs text-(--muted) truncate flex items-center gap-1.5">
                  {status === 'idle' && 'Paste notes and hit Generate'}
                  {status === 'loading' && (
                    <>
                      <span className="w-2 h-2 border-[1.5px] border-(--accent) border-t-transparent rounded-full animate-spin inline-block" /> Generating…
                    </>
                  )}
                  {status === 'error' && 'Something went wrong — try again'}
                  {status === 'success' && study && (
                    <>
                      <span className="inline-flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-(--success)" /> {study.flashcards.length} cards
                      </span>
                      <span>•</span> {study.quiz.length} questions
                    </>
                  )}
                </p>
              </div>
            </div>
            <div className="flex gap-1.5 shrink-0">
              {status === 'success' && study && (
                <>
                  <button
                    onClick={() => saveSet(study)}
                    className="hidden sm:inline-flex px-3 py-1.5 rounded-full text-xs font-semibold border border-(--border) bg-(--bg2) hover:border-(--accent-border) hover:text-(--accent) transition"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setStatus('idle')}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold border border-(--border) bg-transparent hover:bg-(--bg) transition"
                  >
                    New
                  </button>
                </>
              )}
              {status === 'error' && (
                <button
                  onClick={handleGenerate}
                  className="px-3 py-1.5 rounded-full text-xs font-bold bg-linear-to-br from-(--accent) to-(--accent-2) text-white shadow-md hover:shadow-lg transition"
                >
                  Retry
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 flex flex-col animate-[slide-in_0.3s_ease]">
            {status === 'idle' && <EmptyState onExample={setInput} />}
            {status === 'loading' && <LoadingState />}
            {status === 'error' && (
              <ErrorState
                error={error}
                snippet={snippet}
                raw={raw}
                onRetry={handleGenerate}
                onDismiss={() => setStatus('idle')}
                onMock={() => loadMock(input, count, quizCount)}
              />
            )}
            {status === 'success' && study && (
              <Suspense fallback={<div className="p-8 text-center text-sm text-(--muted)">Loading interactive view…</div>}>
                <ResultView study={study} warnings={warnings} elapsed={elapsed} onSave={saveSet} onRegenerate={handleGenerate} />
              </Suspense>
            )}
          </div>
        </div>
      </div>

      <footer className="border-t border-(--border) bg-(--bg2)/60 backdrop-blur py-4 text-center text-xs text-(--muted)">
        <div className="max-w-[1120px] mx-auto px-5">
          <span>© 2026 LearnForge — A simple way to turn notes into practice.</span>
        </div>
      </footer>
    </div>
  )
}
