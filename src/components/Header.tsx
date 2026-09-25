type Props = {
  dark: boolean
  onToggle: () => void
}

export default function Header({ dark, onToggle }: Props) {
  return (
    <header className="sticky top-0 z-20 backdrop-blur-xl bg-[color-mix(in_srgb,var(--bg)_86%,transparent)] border-b border-(--border) supports-[backdrop-filter]:bg-[color-mix(in_srgb,var(--bg)_72%,transparent)]">
      <div className="max-w-[1120px] mx-auto px-5 max-sm:px-4 h-[64px] flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative w-9 h-9 rounded-xl grid place-items-center text-white text-[16px] font-black bg-linear-to-br from-(--accent) to-(--accent-2) shadow-[0_6px_16px_color-mix(in_srgb,var(--accent)_35%,transparent)] overflow-hidden">
            <span className="relative z-10">✦</span>
            <div className="absolute inset-0 bg-linear-to-tr from-white/0 via-white/15 to-white/0 opacity-80" />
          </div>
          <div>
            <div className="font-black tracking-[-0.02em] text-[18px] leading-none text-(--text)">LearnForge</div>
            <div className="text-[11px] font-medium tracking-wide text-(--muted) -mt-0.5">Turn notes into practice</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onToggle}
            aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
            className="group inline-flex items-center gap-2 px-3 py-[7px] rounded-full text-sm font-semibold border bg-(--bg2) border-(--border) text-(--text) hover:border-(--border-strong) hover:shadow-md active:scale-[0.98] transition-all"
          >
            <span className="w-5 h-5 rounded-full bg-(--bg) border border-(--border) grid place-items-center text-[12px] group-hover:rotate-12 transition-transform">
              {dark ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-(--accent)" aria-hidden>
                  <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="1.8" />
                  <path d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-(--accent)" aria-hidden>
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                </svg>
              )}
            </span>
            <span className="hidden sm:inline">{dark ? 'Light' : 'Dark'}</span>
            <span className="sm:hidden">{dark ? '☀️' : '🌙'}</span>
          </button>
          <a
            href="https://github.com/VPbanna123/Flam-Assignment_frontend.git"
            target="_blank"
            rel="noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-[7px] rounded-full text-sm font-semibold border bg-(--accent) border-transparent text-white shadow-[0_4px_12px_color-mix(in_srgb,var(--accent)_30%,transparent)] hover:shadow-[0_6px_16px_color-mix(in_srgb,var(--accent)_40%,transparent)] hover:brightness-110 active:scale-[0.98] transition-all"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M12 2C6.48 2 2 6.58 2 12.26c0 4.51 2.87 8.33 6.84 9.68.5.09.68-.22.68-.48v-1.7c-2.78.62-3.36-1.36-3.36-1.36-.46-1.19-1.11-1.51-1.11-1.51-.91-.64.07-.62.07-.62 1 .07 1.53 1.06 1.53 1.06.89 1.56 2.34 1.11 2.91.85.09-.66.35-1.11.63-1.37-2.22-.26-4.56-1.14-4.56-5.06 0-1.12.39-2.03 1.02-2.75-.1-.26-.44-1.3.1-2.7 0 0 .84-.27 2.75 1.05A9.3 9.3 0 0 1 12 7.3c.85 0 1.7.12 2.5.34 1.9-1.32 2.74-1.05 2.74-1.05.54 1.4.2 2.44.1 2.7.63.72 1.02 1.63 1.02 2.75 0 3.93-2.34 4.8-4.57 5.06.36.32.68.94.68 1.9v2.82c0 .26.18.58.69.48A10.03 10.03 0 0 0 22 12.26C22 6.58 17.52 2 12 2z" />
            </svg>
            Star
          </a>
        </div>
      </div>
    </header>
  )
}
