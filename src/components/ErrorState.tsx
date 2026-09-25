import { isLikelyTruncated } from '../lib/parse'

type Props = {
  error: string
  snippet?: string
  raw?: string
  onRetry: () => void
  onDismiss?: () => void
  onMock?: () => void
}

export default function ErrorState({ error, snippet, raw, onRetry, onDismiss, onMock }: Props) {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(snippet || raw || '')
    } catch {
      /* ignore */
    }
  }

  const truncated = raw ? isLikelyTruncated(raw) : false

  return (
    <div className="p-4 grid gap-3 animate-[slide-in_0.25s_ease]">
      <div
        role="alert"
        className="rounded-2xl p-4 border text-[13px] leading-relaxed grid gap-3 bg-(--danger-bg) border-[color-mix(in_srgb,var(--danger)_18%,transparent)] shadow-sm"
      >
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-(--danger) text-white grid place-items-center shrink-0 text-sm font-bold shadow-sm">!</div>
          <div className="grid gap-1.5 flex-1 min-w-0">
            <strong className="text-[13px] font-black tracking-tight text-[color-mix(in_srgb,var(--danger)_88%,var(--text))]">Couldn’t generate study set</strong>
            <span className="text-(--text) opacity-90 leading-relaxed break-words">{error}</span>
            <span className="text-xs text-(--muted)">Please try again. If the problem continues, shorten your input or try a demo deck.</span>
          </div>
        </div>

        {snippet && (
          <details className="grid gap-1.5 group">
            <summary className="text-xs font-semibold text-(--muted) cursor-pointer list-none flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-(--bg2) border border-(--border) grid place-items-center text-[10px] group-open:rotate-90 transition">›</span> View details
            </summary>
            <pre className="bg-(--bg) border border-(--border) rounded-xl p-3 font-mono text-[11px] leading-relaxed max-h-40 overflow-auto whitespace-pre-wrap break-all text-left shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)]">
              {snippet}
            </pre>
          </details>
        )}

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold bg-linear-to-br from-(--accent) to-(--accent-2) text-white shadow-md hover:shadow-lg hover:brightness-110 active:scale-[0.98] transition"
          >
            Retry
          </button>
          {onMock && (
            <button
              onClick={onMock}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold bg-(--bg2) border border-(--border) text-(--text) hover:border-(--accent-border) hover:text-(--accent) hover:bg-(--accent-bg) transition"
            >
              Try demo deck
            </button>
          )}
          <button
            onClick={copy}
            className="px-3 py-2 rounded-full text-xs font-semibold border border-(--border) bg-(--bg2) hover:bg-(--bg) transition"
          >
            Copy details
          </button>
          {onDismiss && (
            <button onClick={onDismiss} className="px-3 py-2 rounded-full text-xs font-semibold border border-(--border) bg-transparent hover:bg-(--bg) transition ml-auto">
              Dismiss
            </button>
          )}
        </div>
        {truncated && <span className="text-xs bg-(--warn-bg) border border-[color-mix(in_srgb,var(--warn)_18%,transparent)] rounded-full px-2.5 py-1 w-fit">Output was cut off — try a shorter input.</span>}
      </div>
    </div>
  )
}
