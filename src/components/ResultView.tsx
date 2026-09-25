import { lazy, Suspense, useState } from 'react'
import type { StudySet } from '../types'

// Lazy load heavy interactive pieces — demonstrates code splitting
const FlashcardDeck = lazy(() => import('./FlashcardDeck'))
const QuizView = lazy(() => import('./QuizView'))

type Props = {
  study: StudySet
  warnings: string[]
  elapsed: number | null
  onSave: (s: StudySet) => void
  onRegenerate: () => void
}

export default function ResultView({ study, warnings, elapsed, onSave, onRegenerate }: Props) {
  void elapsed
  const [tab, setTab] = useState<'cards' | 'quiz'>('cards')

  return (
    <>
      {warnings.length > 0 && (
        <div className="mx-4 mt-4 rounded-xl p-3 border text-[13px] leading-relaxed grid gap-1.5 bg-(--warn-bg) border-[color-mix(in_srgb,var(--warn)_20%,transparent)] shadow-sm animate-[slide-in_0.3s_ease]">
          <strong className="text-[13px] flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-(--warn) text-white grid place-items-center text-[11px]">!</span> Heads up — recovered with warnings
          </strong>
          <ul className="m-0 pl-4 list-disc marker:text-(--warn)">
            {warnings.map((w, i) => (
              <li key={i} className="text-(--muted) marker:text-(--warn)">
                {w}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="p-4 sm:p-5 grid gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="m-0 text-[22px] font-black tracking-[-0.02em] leading-tight text-(--text)">{study.topic}</h3>
            <p className="mt-1.5 text-[13px] leading-relaxed text-(--muted)">{study.summary}</p>
          </div>

        </div>

        <div className="flex items-center justify-between gap-2.5 flex-wrap">
          <div role="tablist" aria-label="Study modes" className="inline-flex gap-1 p-1.5 bg-(--bg) border border-(--border) rounded-full w-fit shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)]">
            <button
              role="tab"
              aria-selected={tab === 'cards'}
              onClick={() => setTab('cards')}
              className={`px-4 py-2 rounded-full text-[13px] font-bold border transition-all ${tab === 'cards' ? 'bg-(--text) text-(--bg2) border-(--text) shadow-md dark:bg-white dark:text-black dark:border-white' : 'bg-transparent text-(--muted) border-transparent hover:text-(--text)'}`}
            >
              🃏 Cards • {study.flashcards.length}
            </button>
            <button
              role="tab"
              aria-selected={tab === 'quiz'}
              onClick={() => setTab('quiz')}
              className={`px-4 py-2 rounded-full text-[13px] font-bold border transition-all ${tab === 'quiz' ? 'bg-(--text) text-(--bg2) border-(--text) shadow-md dark:bg-white dark:text-black dark:border-white' : 'bg-transparent text-(--muted) border-transparent hover:text-(--text)'}`}
            >
              ❓ Quiz • {study.quiz.length}
            </button>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-(--bg) border border-(--border) text-(--muted) font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-(--success)" /> {study.flashcards.length} cards • {study.quiz.length} questions
          </span>
        </div>
      </div>

      <div className="animate-[slide-in_0.25s_ease]">
        <Suspense fallback={<div className="p-8 text-center text-sm text-(--muted)">Loading view…</div>}>
          {tab === 'cards' ? <FlashcardDeck cards={study.flashcards} topic={study.topic} /> : <QuizView quiz={study.quiz} />}
        </Suspense>
      </div>

      <div className="flex gap-2 flex-wrap px-4 sm:px-5 pb-5 pt-3 border-t border-(--border)/60 mt-2">
        <button onClick={() => onSave(study)} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold border border-(--border) bg-(--bg2) hover:border-(--accent-border) hover:text-(--accent) hover:bg-(--accent-bg) active:scale-[0.98] transition">
          ♡ Save session
        </button>
        <button
          onClick={onRegenerate}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold border border-(--border) bg-transparent hover:bg-(--bg) hover:border-(--border-strong) active:scale-[0.98] transition"
        >
          ↻ Regenerate
        </button>
      </div>
    </>
  )
}
