import { useMemo, useState, memo } from 'react'
import type { QuizQuestion } from '../types'

type Props = {
  quiz: QuizQuestion[]
}

function QuizView({ quiz }: Props) {
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [submitted, setSubmitted] = useState(false)
  const [retestOnlyWrong, setRetestOnlyWrong] = useState(false)

  const filtered = useMemo(() => {
    if (!retestOnlyWrong || !submitted) return quiz
    return quiz.filter((q) => answers[q.id] !== q.answer)
  }, [quiz, answers, submitted, retestOnlyWrong])

  const score = useMemo(() => quiz.reduce((acc, q) => acc + (answers[q.id] === q.answer ? 1 : 0), 0), [quiz, answers])

  const pct = Math.round((score / quiz.length) * 100)
  const answered = Object.keys(answers).length
  const progress = quiz.length ? answered / quiz.length : 0

  return (
    <div className="p-4 sm:p-5 grid gap-4">
      {/* score / progress */}
      <div className="rounded-xl border border-(--border) bg-(--bg)/60 p-3 grid gap-2">
        {!submitted ? (
          <>
            <div className="flex flex-wrap gap-2 items-center justify-between text-xs">
              <span className="text-(--muted) font-medium">Select one answer per question, then submit. Keyboard: 1-4.</span>
              <span className="px-2.5 py-1 rounded-full bg-(--bg2) border border-(--border) font-bold text-(--muted)">{answered}/{quiz.length} answered</span>
            </div>
            <div className="h-1.5 rounded-full bg-(--border) overflow-hidden">
              <div className="h-full bg-linear-to-r from-(--accent) to-(--accent-2) transition-all duration-500" style={{ width: `${progress * 100}%` }} />
            </div>
          </>
        ) : (
          <div className="flex flex-wrap gap-2 items-center">
            <span
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border font-black text-xs shadow-sm ${pct >= 70 ? 'bg-(--success) border-(--success) text-white' : pct >= 40 ? 'bg-(--warn) border-(--warn) text-white' : 'bg-(--danger) border-(--danger) text-white'}`}
            >
              <span className="w-6 h-6 rounded-full bg-white/20 grid place-items-center text-[11px]">{pct >= 70 ? '✓' : pct >= 40 ? '•' : '!'}</span>
              Score {score}/{quiz.length} • {pct}% {pct === 100 ? '• Perfect!' : pct >= 70 ? '• Great!' : ''}
            </span>
            {filtered.length === 0 && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-(--success-bg) border border-[color-mix(in_srgb,var(--success)_18%,transparent)] text-(--success) font-bold text-xs animate-[pulse-subtle_1.2s_ease_infinite]">🎉 Perfect — no wrong answers!</span>}
            {filtered.length > 0 && submitted && !retestOnlyWrong && (
              <span className="text-xs text-(--muted) font-medium">{quiz.filter((q) => answers[q.id] !== q.answer).length} to retest</span>
            )}
            <div className="ml-auto h-1.5 w-24 rounded-full bg-(--border) overflow-hidden hidden sm:block">
              <div className="h-full bg-(--success) transition-all duration-700" style={{ width: `${pct}%` }} />
            </div>
          </div>
        )}
      </div>

      {filtered.map((q) => {
        const sel = answers[q.id]
        const isAnswered = sel !== undefined
        const isCorrect = sel === q.answer
        const showResult = submitted && isAnswered
        const displayIdx = quiz.findIndex((x) => x.id === q.id) + 1
        return (
          <div
            key={q.id}
            className={`rounded-[14px] border-[1.5px] bg-(--bg2) overflow-hidden transition ${showResult ? (isCorrect ? 'border-[color-mix(in_srgb,var(--success)_40%,transparent)] shadow-[0_4px_16px_color-mix(in_srgb,var(--success)_10%,transparent)]' : 'border-[color-mix(in_srgb,var(--danger)_35%,transparent)]') : 'border-(--border)'}`}
          >
            <div className="p-3.5 pb-2.5 flex gap-2.5 items-start justify-between">
              <div
                className={`w-7 h-7 rounded-full grid place-items-center font-extrabold text-xs shrink-0 border ${showResult ? (isCorrect ? 'bg-(--success-bg) border-[color-mix(in_srgb,var(--success)_25%,transparent)] text-(--success)' : 'bg-(--danger-bg) border-[color-mix(in_srgb,var(--danger)_25%,transparent)] text-(--danger)') : 'bg-(--accent-bg) border-(--accent-border) text-(--accent)'}`}
              >
                {displayIdx}
              </div>
              <p className="font-semibold text-sm leading-[1.45] m-0 flex-1 text-(--text)">{q.question}</p>
              {showResult && <span className={`text-xs font-extrabold ${isCorrect ? 'text-(--success)' : 'text-(--danger)'}`}>{isCorrect ? '✓' : '✕'}</span>}
            </div>

            <div className="grid gap-2 px-4 pb-3">
              {q.options.map((opt, oi) => {
                const isSel = sel === oi
                const isRight = q.answer === oi
                let cls =
                  'group flex gap-3 items-center px-3.5 py-3 rounded-xl border cursor-pointer text-[13px] text-left transition font-medium bg-(--bg) border-(--border) hover:border-(--border-strong) hover:bg-(--bg2) active:scale-[0.99]'
                if (submitted) {
                  if (isRight) cls = 'flex gap-3 items-center px-3.5 py-3 rounded-xl border text-[13px] text-left bg-(--success-bg) border-(--success) font-semibold shadow-sm'
                  else if (isSel && !isRight) cls = 'flex gap-3 items-center px-3.5 py-3 rounded-xl border text-[13px] text-left bg-(--danger-bg) border-(--danger) font-semibold shadow-sm'
                  else if (isSel) cls = 'flex gap-3 items-center px-3.5 py-3 rounded-xl border text-[13px] text-left bg-(--accent-bg) border-(--accent) font-semibold'
                } else if (isSel) {
                  cls = 'flex gap-3 items-center px-3.5 py-3 rounded-xl border text-[13px] text-left bg-(--accent-bg) border-(--accent) font-semibold shadow-sm ring-2 ring-(--ring)'
                }
                const label = String.fromCharCode(65 + oi)
                return (
                  <label key={oi} className={cls}>
                    <span
                      className={`w-7 h-7 rounded-full grid place-items-center text-xs font-black shrink-0 border transition ${submitted && isRight ? 'bg-(--success) border-(--success) text-white' : submitted && isSel && !isRight ? 'bg-(--danger) border-(--danger) text-white' : isSel ? 'bg-(--accent) border-(--accent) text-white' : 'bg-(--bg2) border-(--border) text-(--muted) group-hover:border-(--accent-border) group-hover:text-(--accent)'}`}
                    >
                      {submitted && isRight ? '✓' : submitted && isSel && !isRight ? '✕' : label}
                    </span>
                    <input
                      type="radio"
                      name={`q-${q.id}`}
                      checked={isSel}
                      onChange={() => setAnswers((a) => ({ ...a, [q.id]: oi }))}
                      disabled={submitted && retestOnlyWrong}
                      className="sr-only"
                      aria-label={`Option ${oi + 1}: ${opt}`}
                    />
                    <span className="flex-1 leading-snug">{opt}</span>
                    {submitted && isRight && !isSel && <span className="text-[11px] font-bold text-(--success) hidden sm:inline">correct</span>}
                  </label>
                )
              })}
            </div>

            {submitted && (
              <div
                className={`mx-4 mb-4 p-3 rounded-xl border text-xs leading-relaxed flex gap-2.5 ${answers[q.id] === q.answer ? 'bg-(--success-bg) border-[color-mix(in_srgb,var(--success)_20%,transparent)] text-(--success)' : 'bg-(--bg) border-(--border) text-(--muted)'}`}
              >
                <span className={`w-6 h-6 rounded-full grid place-items-center shrink-0 text-[11px] font-bold border ${answers[q.id] === q.answer ? 'bg-(--success) text-white border-(--success)' : 'bg-(--danger) text-white border-(--danger)'}`}>
                  {answers[q.id] === q.answer ? '✓' : '!'}
                </span>
                <span>
                  <strong className="text-(--text)">{answers[q.id] === q.answer ? 'Correct. ' : `Answer: ${q.options[q.answer]} — `}</strong>
                  {q.explanation}
                </span>
              </div>
            )}
          </div>
        )
      })}

      <div className="flex gap-2 flex-wrap pt-1">
        {!submitted ? (
          <>
            <button
              onClick={() => setSubmitted(true)}
              disabled={Object.keys(answers).length !== quiz.length}
              title={Object.keys(answers).length !== quiz.length ? `Answer all ${quiz.length} first (${answered}/${quiz.length})` : undefined}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-sm font-bold bg-linear-to-br from-(--accent) to-(--accent-2) text-white shadow-[0_6px_16px_color-mix(in_srgb,var(--accent)_30%,transparent)] hover:shadow-[0_8px_20px_color-mix(in_srgb,var(--accent)_40%,transparent)] hover:brightness-110 active:scale-[0.98] disabled:opacity-40 disabled:shadow-none disabled:brightness-100 transition"
            >
              Submit quiz {answered === quiz.length ? '✓' : `• ${answered}/${quiz.length}`}
            </button>
            <button onClick={() => setAnswers({})} className="px-4 py-2.5 rounded-full text-sm font-semibold border border-(--border) bg-(--bg2) hover:bg-(--bg) active:scale-[0.98] transition">
              Clear
            </button>
            <span className="text-xs text-(--muted2) self-center ml-1 hidden sm:inline">You can submit only when all answered</span>
          </>
        ) : (
          <>
            {!retestOnlyWrong && filtered.length > 0 && quiz.some((q) => answers[q.id] !== q.answer) && (
              <button onClick={() => setRetestOnlyWrong(true)} className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-sm font-bold bg-linear-to-br from-(--accent) to-(--accent-2) text-white shadow-md hover:shadow-lg hover:brightness-110 active:scale-[0.98] transition">
                ↻ Retest wrong ({quiz.filter((q) => answers[q.id] !== q.answer).length})
              </button>
            )}
            {retestOnlyWrong ? (
              <button onClick={() => { setRetestOnlyWrong(false); setSubmitted(false); setAnswers({}) }} className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-sm font-bold bg-linear-to-br from-(--accent) to-(--accent-2) text-white shadow-md hover:shadow-lg transition">
                Restart full quiz
              </button>
            ) : (
              <>
                <button onClick={() => setSubmitted(false)} className="px-4 py-2.5 rounded-full text-sm font-semibold border border-(--border) bg-(--bg2) hover:bg-(--bg) active:scale-[0.98] transition">
                  Edit answers
                </button>
                <button onClick={() => { setAnswers({}); setSubmitted(false); setRetestOnlyWrong(false) }} className="px-4 py-2.5 rounded-full text-sm font-semibold border border-(--border) bg-transparent hover:bg-(--bg) active:scale-[0.98] transition">
                  Retry all
                </button>
              </>
            )}
            {retestOnlyWrong && (
              <button onClick={() => { setRetestOnlyWrong(false); setSubmitted(false) }} className="px-4 py-2.5 rounded-full text-sm font-semibold border border-(--border) bg-(--bg2) hover:bg-(--bg) transition">
                Back to full
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default memo(QuizView)
