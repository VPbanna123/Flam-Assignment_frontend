type Props = {
  onExample: (text: string) => void
}

const EXAMPLES = [
  { label: 'Photosynthesis', text: `Photosynthesis — light-dependent reactions in thylakoids produce ATP and NADPH, Calvin cycle in stroma fixes CO2 into glucose. Equation: 6CO2 + 6H2O + light -> C6H12O6 + 6O2. Factors: light intensity, CO2, temperature, chlorophyll.` },
  { label: 'ML notes', text: `Machine learning: supervised (labeled data: classification vs regression), unsupervised (clustering, dimensionality reduction), overfitting vs underfitting, bias-variance tradeoff. Metrics: accuracy, precision, recall, F1. Gradient descent optimizes loss. Train/val/test split prevents leakage.` },
]

export default function EmptyState({ onExample }: Props) {
  return (
    <div className="px-6 sm:px-8 py-8 text-center grid gap-4 place-items-center animate-[slide-in_0.35s_ease]">
      {/* stacked cards illustration */}
      <div className="relative w-full max-w-[360px] h-[108px] grid place-items-center">
        <div className="absolute inset-0 bg-gradient-to-br from-(--accent-bg) via-transparent to-(--bg3) rounded-3xl blur-2xl opacity-60" />
        <div className="relative flex gap-2.5 -rotate-[1deg]">
          <div className="w-[92px] h-[72px] rounded-xl border border-(--border) bg-(--bg2) shadow-(--shadow) grid place-items-center text-lg rotate-[-4deg] animate-[float_3s_ease-in-out_infinite]">🃏</div>
          <div className="w-[92px] h-[72px] rounded-xl border border-(--accent-border) bg-linear-to-br from-(--accent-bg) to-(--bg2) shadow-(--shadow) grid place-items-center text-lg rotate-[2deg] animate-[float_3s_ease-in-out_infinite_0.3s] z-10">❓</div>
          <div className="w-[92px] h-[72px] rounded-xl border border-(--border) bg-(--bg2) shadow-(--shadow) grid place-items-center text-lg rotate-[-1deg] animate-[float_3s_ease-in-out_infinite_0.6s]">✓</div>
        </div>
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-16 h-16 rounded-2xl grid place-items-center text-xl bg-linear-to-br from-(--accent) to-(--accent-2) text-white shadow-[0_8px_20px_color-mix(in_srgb,var(--accent)_30%,transparent)] border border-white/20">
          ✦
        </div>
      </div>

      <div className="grid gap-2 max-w-[42ch]">
        <h3 className="m-0 text-[18px] font-black tracking-tight text-(--text)">Ready when you are</h3>
        <p className="m-0 text-[13px] leading-relaxed text-(--muted)">
          Paste your notes — we’ll make <b className="text-(--text)">flippable cards</b> and a <b className="text-(--text)">scored quiz</b> you can work through.
        </p>
      </div>

      <div className="flex gap-2 flex-wrap justify-center">
        {EXAMPLES.map((ex) => (
          <button
            key={ex.label}
            onClick={() => onExample(ex.text)}
            className="group inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold bg-(--accent-bg) border border-(--accent-border) text-(--accent) hover:brightness-105 hover:shadow-sm hover:border-(--accent) active:scale-[0.98] transition"
          >
            Try {ex.label} <span className="group-hover:translate-x-0.5 transition">→</span>
          </button>
        ))}
      </div>

      <div className="grid gap-2 w-full max-w-[420px] text-left mt-1">
        <div className="rounded-xl border border-(--border) bg-(--bg)/60 px-3 py-2.5 flex gap-2.5 items-start text-xs text-(--muted)">
          <span className="w-6 h-6 rounded-full bg-(--accent-bg) border border-(--accent-border) grid place-items-center shrink-0 text-[11px]">⌨️</span>
          <span>
            <b className="text-(--text)">Keyboard-first:</b> Cards → <code className="font-mono bg-(--bg2) border border-(--border) px-1 rounded">←</code> <code className="font-mono bg-(--bg2) border border-(--border) px-1 rounded">→</code> navigate,{' '}
            <code className="font-mono bg-(--bg2) border border-(--border) px-1 rounded">Space</code> flip • Quiz →{' '}
            <code className="font-mono bg-(--bg2) border border-(--border) px-1 rounded">1-4</code> answer
          </span>
        </div>
        <div className="text-[11px] text-(--muted2) text-center">Paste anything — lecture notes, a topic, or messy bullets. No auth, mobile-ready.</div>
      </div>
    </div>
  )
}
