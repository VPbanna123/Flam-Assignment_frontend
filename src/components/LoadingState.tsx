export default function LoadingState() {
  return (
    <div className="p-4 sm:p-5 grid gap-4" aria-live="polite" aria-busy="true">
      <div className="flex items-center gap-2 text-xs text-(--muted)">
        <span className="w-3 h-3 border-2 border-(--accent)/30 border-t-(--accent) rounded-full animate-spin" />
        Creating your study set…
      </div>

      <div className="grid gap-3">
        <div className="h-3.5 w-[42%] rounded-full bg-gradient-to-r from-(--border) via-(--accent-bg) to-(--border) bg-[length:200%_100%] animate-[shimmer_1.2s_infinite]" />
        <div className="h-3.5 w-[86%] rounded-full bg-gradient-to-r from-(--border) via-(--accent-bg) to-(--border) bg-[length:200%_100%] animate-[shimmer_1.2s_infinite]" style={{ animationDelay: '0.1s' }} />
        <div className="h-3.5 w-[72%] rounded-full bg-gradient-to-r from-(--border) via-(--accent-bg) to-(--border) bg-[length:200%_100%] animate-[shimmer_1.2s_infinite]" style={{ animationDelay: '0.2s' }} />
      </div>

      {/* card skeleton */}
      <div className="grid gap-3">
        <div className="relative h-[156px] w-full rounded-2xl border border-(--border) bg-(--bg)/60 overflow-hidden p-4 flex flex-col justify-center gap-3">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[color-mix(in_srgb,var(--accent-bg)_60%,transparent)] to-transparent bg-[length:200%_100%] animate-[shimmer_1.3s_infinite]" />
          <div className="h-2 w-16 rounded-full bg-(--accent-bg) border border-(--accent-border) relative" />
          <div className="h-4 w-[78%] rounded-full bg-(--border) relative bg-gradient-to-r from-(--border) via-(--accent-bg) to-(--border) bg-[length:200%_100%] animate-[shimmer_1.2s_infinite]" />
          <div className="h-4 w-[62%] rounded-full bg-(--border) relative" />
          <div className="absolute bottom-3 right-3 h-6 w-16 rounded-full bg-(--bg2) border border-(--border)" />
        </div>

        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-10 rounded-xl border border-(--border) bg-(--bg)/50 bg-gradient-to-r from-(--border) via-(--accent-bg) to-(--border) bg-[length:200%_100%] animate-[shimmer_1.2s_infinite]"
              style={{ animationDelay: `${i * 0.12}s` }}
            />
          ))}
        </div>

        <div className="h-3.5 w-[68%] rounded-full bg-gradient-to-r from-(--border) via-(--accent-bg) to-(--border) bg-[length:200%_100%] animate-[shimmer_1.2s_infinite]" />
        <div className="h-3.5 w-[92%] rounded-full bg-gradient-to-r from-(--border) via-(--accent-bg) to-(--border) bg-[length:200%_100%] animate-[shimmer_1.2s_infinite]" />
        <div className="grid gap-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className="h-[64px] rounded-xl border border-(--border) bg-(--bg)/40 bg-gradient-to-r from-(--border) via-(--accent-bg) to-(--border) bg-[length:200%_100%] animate-[shimmer_1.2s_infinite]"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>

      <div className="flex items-center justify-center text-xs text-(--muted)">Please wait — this usually takes a few seconds.</div>
      <style>{`@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}`}</style>
    </div>
  )
}
