import { useMemo } from 'react'
import { useDebounce } from '../hooks/useDebounce'

const EXAMPLES = [
  { label: 'Photosynthesis', icon: '🌿', text: `Photosynthesis — light-dependent reactions in thylakoids produce ATP and NADPH, Calvin cycle in stroma fixes CO2 into glucose. Equation: 6CO2 + 6H2O + light -> C6H12O6 + 6O2. Factors: light intensity, CO2, temperature, chlorophyll.` },
  { label: 'React Hooks', icon: '⚛️', text: `React Hooks: useState for state, useEffect for side effects with dependency array, useRef for mutable refs without re-render, useMemo/useCallback for memoization. Rules: only call at top level, only in React functions. useEffect cleanup runs before next effect and on unmount.` },
  { label: 'World War II', icon: '🌍', text: `World War II (1939-1945): triggered by Germany's invasion of Poland, Axis vs Allies, major events: Blitzkrieg, Battle of Britain, Pearl Harbor (1941 US enters), D-Day (June 6 1944), Hiroshima/Nagasaki atomic bombs, Yalta Conference. Result: UN founded, Cold War begins.` },
  { label: 'ML notes', icon: '🤖', text: `Machine learning: supervised (labeled data: classification vs regression), unsupervised (clustering, dimensionality reduction), overfitting vs underfitting, bias-variance tradeoff. Metrics: accuracy, precision, recall, F1. Gradient descent optimizes loss. Train/val/test split prevents leakage.` },
]

type Props = {
  input: string
  onChange: (v: string) => void
  count: number
  onCount: (n: number) => void
  quizCount: number
  onQuizCount: (n: number) => void
  difficulty: string
  onDifficulty: (d: string) => void
  onGenerate: () => void
  onCancel: () => void
  status: 'idle' | 'loading' | 'success' | 'error'
  savedCount: number
  onLoadSaved: (topic: string) => void
  savedTopics: { topic: string; cards: number; quiz: number }[]
  onClearSaved: () => void
}

export default function PromptInput({
  input,
  onChange,
  count,
  onCount,
  quizCount,
  onQuizCount,
  difficulty,
  onDifficulty,
  onGenerate,
  onCancel,
  status,
  savedTopics,
  onLoadSaved,
  onClearSaved,
}: Props) {
  // Debounce for expensive derived stats — demonstrates debouncing pattern
  const debounced = useDebounce(input, 250)
  const stats = useMemo(() => {
    const t = debounced.trim()
    return {
      chars: t.length,
      words: t ? t.split(/\s+/).length : 0,
    }
  }, [debounced])

  const isLoading = status === 'loading'

  const tooShort = debounced.trim().length > 0 && debounced.trim().length < 8
  const ready = input.trim().length >= 8
  const empty = !input.trim()

  return (
    <div className="bg-(--bg2) border border-(--border) rounded-2xl shadow-(--shadow) overflow-hidden">
      <div className="px-4 py-3.5 border-b border-(--border) flex items-center justify-between gap-3 bg-[color-mix(in_srgb,var(--bg2)_92%,var(--accent-bg))]">
        <div>
          <h2 className="m-0 text-[13px] font-black tracking-tight text-(--text) flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-(--accent) text-white grid place-items-center text-[11px]">✎</span>
            Your material
          </h2>
          <p className="m-0 text-xs text-(--muted) ml-8">Free-form — paste anything, we structure it</p>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest border transition ${
            empty
              ? 'bg-(--bg) border-(--border) text-(--muted)'
              : tooShort
                ? 'bg-(--warn-bg) border-[color-mix(in_srgb,var(--warn)_25%,transparent)] text-(--warn)'
                : ready
                  ? 'bg-(--success-bg) border-[color-mix(in_srgb,var(--success)_25%,transparent)] text-(--success)'
                  : 'bg-(--accent-bg) border-(--accent-border) text-(--accent)'
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${empty ? 'bg-(--muted2)' : tooShort ? 'bg-(--warn)' : 'bg-(--success)'} ${!empty && !tooShort ? 'animate-pulse' : ''}`} />
          {stats.chars} chars • {stats.words}w
        </span>
      </div>

      <div className="p-4 max-sm:p-3.5">
        <div className="relative group">
          <textarea
            value={input}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`Paste lecture notes, a topic, or messy bullets…

Examples:
• "Mitosis has 4 phases: prophase, metaphase, anaphase, telophase — explain each"
• "Explain quantum entanglement for a 10th grader"
• "World War II: causes, major battles, aftermath…"`}
            rows={9}
            aria-label="Study material input"
            disabled={isLoading}
            className={`w-full min-h-[188px] resize-y rounded-xl border-[1.5px] bg-(--bg) text-(--text) p-3 pr-3 text-sm leading-6 outline-none placeholder:text-(--muted2) transition disabled:opacity-60 shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)] ${
              tooShort ? 'border-(--warn) focus:border-(--warn) focus:ring-4 focus:ring-[color-mix(in_srgb,var(--warn)_15%,transparent)]' : 'border-(--border) focus:border-(--accent) focus:ring-4 focus:ring-[color-mix(in_srgb,var(--accent)_16%,transparent)]'
            }`}
          />
          <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-focus-within:opacity-100 transition pointer-events-none">
            <span className="text-[10px] font-medium px-1.5 py-1 rounded-full bg-(--bg2) border border-(--border) text-(--muted) shadow-sm">⌘ + Enter to generate</span>
          </div>
        </div>

        {tooShort && <div className="mt-2 text-xs font-medium text-(--warn) flex items-center gap-1.5">⚠️ Add a bit more — at least 8 characters for best results.</div>}

        <div className="mt-2.5 flex flex-wrap gap-2 items-center justify-between text-xs">
          <span className={empty ? 'text-(--muted2)' : 'text-(--muted)'}>{empty ? 'Empty — pick an example below' : `${stats.words} words`}</span>
          <div className="flex gap-1.5">
            <button
              onClick={() => onChange('')}
              disabled={!input || isLoading}
              className="px-3 py-1.5 rounded-full text-xs font-semibold border border-(--border) bg-transparent hover:bg-(--bg) disabled:opacity-40 hover:border-(--border-strong) transition"
            >
              Clear
            </button>
            <button
              onClick={() => onChange(EXAMPLES[1]!.text)}
              disabled={isLoading}
              className="px-3 py-1.5 rounded-full text-xs font-semibold border border-(--accent-border) bg-(--accent-bg) text-(--accent) hover:brightness-105 hover:border-(--accent) transition"
            >
              ↻ Load sample
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2.5 mt-3 max-sm:gap-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold tracking-widest uppercase text-(--muted)">Cards</span>
            <select
              value={count}
              onChange={(e) => onCount(Number(e.target.value))}
              disabled={isLoading}
              title="How many flashcards to generate"
              className="rounded-xl border-[1.5px] border-(--border) bg-(--bg) text-(--text) px-2.5 py-2.5 text-[13px] font-medium outline-none focus:border-(--accent) focus:ring-3 focus:ring-(--ring) transition"
            >
              <option value={4}>4 — quick</option>
              <option value={6}>6 — balanced</option>
              <option value={8}>8 — deep</option>
              <option value={10}>10 — exam</option>
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold tracking-widest uppercase text-(--muted)">Quiz</span>
            <select
              value={quizCount}
              onChange={(e) => onQuizCount(Number(e.target.value))}
              disabled={isLoading}
              title="How many quiz questions to generate"
              className="rounded-xl border-[1.5px] border-(--border) bg-(--bg) text-(--text) px-2.5 py-2.5 text-[13px] font-medium outline-none focus:border-(--accent) focus:ring-3 focus:ring-(--ring) transition"
            >
              <option value={3}>3 — quick</option>
              <option value={5}>5 — balanced</option>
              <option value={7}>7 — deep</option>
              <option value={10}>10 — exam</option>
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold tracking-widest uppercase text-(--muted)">Difficulty</span>
            <select
              value={difficulty}
              onChange={(e) => onDifficulty(e.target.value)}
              disabled={isLoading}
              className="rounded-xl border-[1.5px] border-(--border) bg-(--bg) text-(--text) px-2.5 py-2.5 text-[13px] font-medium outline-none focus:border-(--accent) focus:ring-3 focus:ring-(--ring) transition"
            >
              <option value="mixed">Mixed</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </label>
        </div>

        <div className="mt-3">
          <div className="text-[11px] font-bold tracking-widest uppercase text-(--muted) mb-1.5">Try an example</div>
          <div className="flex flex-wrap gap-1.5">
            {EXAMPLES.map((ex) => (
              <button
                key={ex.label}
                onClick={() => onChange(ex.text)}
                disabled={isLoading}
                className="group inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-full border border-dashed border-(--border-strong) bg-(--bg) text-(--muted) hover:border-(--accent) hover:text-(--accent) hover:bg-(--accent-bg) disabled:opacity-50 transition"
              >
                <span className="group-hover:scale-110 transition">{ex.icon}</span> {ex.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <button
            onClick={onGenerate}
            disabled={isLoading || !input.trim() || tooShort}
            aria-busy={isLoading}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') onGenerate()
            }}
            className="flex-1 inline-flex justify-center items-center gap-2 px-5 py-3 rounded-full font-bold text-sm bg-linear-to-br from-(--accent) to-(--accent-2) text-white border border-transparent shadow-[0_8px_20px_color-mix(in_srgb,var(--accent)_35%,transparent)] hover:shadow-[0_10px_28px_color-mix(in_srgb,var(--accent)_45%,transparent)] hover:brightness-110 active:scale-[0.99] disabled:opacity-40 disabled:shadow-none disabled:brightness-100 transition-all"
          >
            {isLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" aria-hidden />
                Generating…
              </>
            ) : (
              <>
                <span className="text-base leading-none">✦</span> Generate study set <span className="hidden sm:inline font-medium opacity-90">• {count}c / {quizCount}q</span>
              </>
            )}
          </button>
          {isLoading && (
            <button onClick={onCancel} type="button" className="px-4 py-2.5 rounded-full text-sm font-semibold border border-(--border) bg-(--bg2) hover:bg-(--bg) hover:border-(--border-strong) active:scale-[0.98] transition">
              Cancel
            </button>
          )}
        </div>

        {savedTopics.length > 0 && (
          <div className="mt-4 pt-3.5 border-t border-(--border)">
            <div className="flex items-center justify-between mb-2">
              <div className="text-[11px] font-extrabold tracking-widest uppercase text-(--muted)">Saved sessions • {savedTopics.length}</div>
              <button onClick={onClearSaved} className="text-[11px] px-2.5 py-1 rounded-full font-semibold border border-(--border) bg-transparent hover:bg-(--danger-bg) hover:border-[color-mix(in_srgb,var(--danger)_25%,transparent)] hover:text-(--danger) transition">
                Clear all
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {savedTopics.map((s) => (
                <button
                  key={s.topic}
                  onClick={() => onLoadSaved(s.topic)}
                  className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-solid border-(--accent-border) bg-(--accent-bg) text-(--accent) hover:brightness-105 hover:shadow-sm transition"
                  title={`${s.cards} cards • ${s.quiz} questions`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-(--accent)" /> {s.topic} <span className="opacity-60">• {s.cards}c/{s.quiz}q</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
