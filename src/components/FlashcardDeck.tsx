import { useEffect, useMemo, useState, memo } from 'react'
import type { Flashcard } from '../types'

type Props = {
  cards: Flashcard[]
  topic: string
}

function FlashcardDeck({ cards, topic }: Props) {
  const [idx, setIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [known, setKnown] = useState<Set<number>>(new Set())
  const [shuffled, setShuffled] = useState(false)

  // deterministic shuffle — same topic → same shuffle (no random)
  const display = useMemo(() => {
    if (!shuffled) return cards
    const arr = [...cards]
    let seed = topic.length * 31
    for (let i = arr.length - 1; i > 0; i--) {
      seed = (seed * 1664525 + 1013904223) % 4294967296
      const j = seed % (i + 1)
      ;[arr[i]!, arr[j]!] = [arr[j]!, arr[i]!]
    }
    return arr
  }, [cards, shuffled, topic])

  useEffect(() => {
    setIdx(0)
    setFlipped(false)
    setKnown(new Set())
    setShuffled(false)
  }, [cards])

  // keyboard nav — demonstrates system design: component owns its shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        setFlipped(false)
        window.setTimeout(() => setIdx((i) => (i + 1) % display.length), 120)
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        setFlipped(false)
        window.setTimeout(() => setIdx((i) => (i - 1 + display.length) % display.length), 120)
      }
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        setFlipped((f) => !f)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [display.length])

  const current = display[idx]

  if (!current) return null

  return (
    <div className="p-4 sm:p-5 grid gap-4">
      {/* progress header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-bold">
          <span className="px-2.5 py-1 rounded-full bg-(--accent-bg) border border-(--accent-border) text-(--accent)">
            {idx + 1} / {display.length}
          </span>
          <span className="hidden sm:inline text-(--muted) font-medium">Use ← → or swipe • Space to flip</span>
          <span className="sm:hidden text-(--muted) font-medium">Swipe • tap flip</span>
        </div>
        <div className="flex gap-1 items-center" aria-hidden>
          {display.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${i === idx ? 'w-6 bg-(--accent) shadow-[0_2px_8px_color-mix(in_srgb,var(--accent)_40%,transparent)]' : known.has(display[i]!.id) ? 'w-1.5 bg-(--success)' : 'w-1.5 bg-(--border)'}`}
            />
          ))}
        </div>
      </div>

      {/* main card — 3D flip */}
      <div
        className={`relative h-[200px] sm:h-[220px] cursor-pointer select-none perspective-1000 group ${flipped ? '[&>div]:[transform:rotateY(180deg)]' : ''}`}
        onClick={() => setFlipped((v) => !v)}
        role="button"
        tabIndex={0}
        aria-label={`Flashcard ${idx + 1} of ${display.length}. ${flipped ? 'Back' : 'Front'}. Click or Space to flip.`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setFlipped((v) => !v)
          }
        }}
      >
        <div className="w-full h-full relative preserve-3d transition-transform duration-500 ease-[cubic-bezier(.2,.8,.2,1)] rounded-2xl">
          {/* front */}
          <div className="absolute inset-0 rounded-2xl border border-(--border) bg-(--bg2) shadow-(--shadow) p-5 sm:p-6 flex flex-col justify-center gap-2 backface-hidden overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-(--accent-bg)/0 via-(--accent-bg)/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative flex items-center gap-2">
              <span className="text-[10px] font-black tracking-[0.12em] uppercase text-(--accent) px-2 py-1 rounded-full bg-(--accent-bg) border border-(--accent-border)">Question</span>
              <span className="text-[11px] text-(--muted2)">{idx + 1} • {display.length}</span>
            </div>
            <div className="relative text-[clamp(15px,2.6vw,18px)] font-semibold tracking-[-0.015em] leading-[1.4] text-(--text) line-clamp-4">{current.front}</div>
            <div className="absolute bottom-3 right-3 text-[11px] font-semibold text-(--muted) inline-flex items-center gap-1.5 bg-(--bg) border border-(--border) px-2.5 py-1 rounded-full shadow-sm group-hover:border-(--accent-border) group-hover:text-(--accent) transition">
              <span className="hidden sm:inline">Click or Space</span> ↩ Flip
            </div>
          </div>
          {/* back */}
          <div className="absolute inset-0 rounded-2xl border border-(--accent-border) bg-linear-to-br from-(--accent-bg) via-(--bg2) to-(--bg2) shadow-(--shadow-lg) p-5 sm:p-6 flex flex-col justify-center gap-2 backface-hidden rotate-y-180 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-(--accent)/5 via-transparent to-transparent" />
            <div className="relative flex items-center gap-2">
              <span className="text-[10px] font-black tracking-[0.12em] uppercase text-white px-2 py-1 rounded-full bg-(--accent) shadow-sm">Answer</span>
              <span className="text-[11px] text-(--muted)">{known.has(current.id) ? '★ Known' : 'Keep going'}</span>
            </div>
            <div className="relative text-[clamp(15px,2.6vw,18px)] font-semibold tracking-[-0.015em] leading-[1.4] text-(--text) line-clamp-4">{current.back}</div>
            <div className="absolute bottom-3 right-3 text-[11px] font-semibold text-(--muted) inline-flex items-center gap-1.5 bg-(--bg) border border-(--border) px-2.5 py-1 rounded-full shadow-sm">↩ Back</div>
          </div>
        </div>
      </div>

      {/* controls */}
      <div className="flex gap-2">
        <button
          onClick={() => {
            setFlipped(false)
            window.setTimeout(() => setIdx((i) => (i - 1 + display.length) % display.length), 120)
          }}
          className="flex-1 inline-flex justify-center items-center gap-1.5 px-3 py-2.5 rounded-full text-sm font-semibold border border-(--border) bg-(--bg2) hover:bg-(--bg) hover:border-(--border-strong) active:scale-[0.98] transition"
          aria-label="Previous card"
        >
          ← Prev
        </button>
        <button
          onClick={() => setFlipped((v) => !v)}
          className="flex-1 inline-flex justify-center items-center gap-1.5 px-3 py-2.5 rounded-full text-sm font-bold border border-(--accent-border) bg-(--accent-bg) text-(--accent) hover:brightness-105 active:scale-[0.98] transition"
        >
          Flip ↩
        </button>
        <button
          onClick={() => {
            setFlipped(false)
            window.setTimeout(() => setIdx((i) => (i + 1) % display.length), 120)
          }}
          className="flex-1 inline-flex justify-center items-center gap-1.5 px-3 py-2.5 rounded-full text-sm font-bold bg-linear-to-br from-(--accent) to-(--accent-2) text-white border border-transparent shadow-[0_6px_16px_color-mix(in_srgb,var(--accent)_30%,transparent)] hover:shadow-[0_8px_22px_color-mix(in_srgb,var(--accent)_40%,transparent)] hover:brightness-110 active:scale-[0.98] transition"
        >
          Next →
        </button>
      </div>

      <div className="flex gap-2 items-center flex-wrap">
        <button
          onClick={() => {
            const id = current.id
            setKnown((prev) => {
              const n = new Set(prev)
              if (n.has(id)) n.delete(id)
              else n.add(id)
              return n
            })
          }}
          className={`px-3.5 py-2 rounded-full text-xs font-bold border transition ${known.has(current.id) ? 'bg-(--success) border-(--success) text-white shadow-md' : 'bg-(--bg2) border-(--border) text-(--text) hover:border-(--success)/30 hover:text-(--success)'}`}
        >
          {known.has(current.id) ? '★ Known — tap to undo' : '☆ Mark known'}
        </button>
        <span className="text-xs px-3 py-2 rounded-full bg-(--success-bg) border border-[color-mix(in_srgb,var(--success)_18%,transparent)] text-(--success) font-bold flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-(--success) animate-pulse" /> {known.size} known • {display.length - known.size} to learn
        </span>
        <button onClick={() => setShuffled((v) => !v)} className="ml-auto px-3.5 py-2 rounded-full text-xs font-bold border border-(--border) bg-(--bg) hover:border-(--accent-border) hover:text-(--accent) active:scale-[0.98] transition">
          {shuffled ? '↺ Original order' : '⇄ Shuffle — deterministic'}
        </button>
      </div>

      {/* mini list */}
      <div className="grid gap-2">
        <div className="text-[11px] font-bold tracking-widest uppercase text-(--muted) px-1">Quick jump</div>
        {display.map((c, i) => (
          <button
            key={c.id}
            onClick={() => {
              setIdx(i)
              setFlipped(false)
            }}
            className={`text-left border rounded-xl p-3 grid gap-1.5 bg-(--bg) hover:border-(--accent-border) hover:bg-(--accent-bg)/50 active:scale-[0.99] transition text-sm ${i === idx ? 'border-(--accent) bg-(--accent-bg) shadow-sm ring-2 ring-(--ring)' : known.has(c.id) ? 'border-[color-mix(in_srgb,var(--success)_22%,transparent)] bg-(--success-bg)/60' : 'border-(--border)'}`}
          >
            <strong className="text-[13px] text-(--text) leading-snug flex gap-2">
              <span className={`w-5 h-5 rounded-full grid place-items-center text-[10px] font-black shrink-0 mt-0.5 ${i === idx ? 'bg-(--accent) text-white' : known.has(c.id) ? 'bg-(--success) text-white' : 'bg-(--border) text-(--muted)'}`}>{i + 1}</span>
              <span>{c.front}</span>
            </strong>
            <span className="text-[13px] text-(--muted) ml-7 leading-relaxed line-clamp-2">{c.back}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

export default memo(FlashcardDeck)
