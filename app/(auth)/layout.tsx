export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    /* fixed inset-0 so this page covers the full viewport regardless of
       the sidebar padding applied to <main> in the root layout */
    <div className="fixed inset-0 z-50 flex flex-col overflow-y-auto lg:flex-row">


      {/* ── Left decorative panel ───────────────────────────── */}
      <div
        className="relative hidden overflow-hidden lg:flex lg:w-2/5 lg:flex-col lg:justify-between lg:pl-8 lg:pr-10 lg:py-12"
        style={{ background: "linear-gradient(135deg, #3730a3 0%, #4f46e5 40%, #7c3aed 70%, #8b5cf6 100%)" }}
      >
        {/* Grid overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        {/* Glow blobs */}
        <div className="pointer-events-none absolute -left-20 -top-20 h-80 w-80 rounded-full bg-indigo-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -right-20 h-96 w-96 rounded-full bg-violet-300/15 blur-3xl" />

        {/* Spacer for logo */}
        <div className="h-16" />

        {/* Floating card mockups */}
        <div className="relative z-10 flex flex-col gap-6 py-8">
          <div
            className="relative w-72 overflow-hidden rounded-2xl p-6 shadow-2xl"
            style={{ background: "linear-gradient(135deg, #1a3c6e, #3a6fa8)", rotate: "-4deg" }}
          >
            <div className="flex items-start justify-between">
              <span className="text-xs font-bold tracking-widest text-white/70">CHASE</span>
              <div className="h-7 w-10 rounded bg-yellow-400/80" />
            </div>
            <p className="mt-6 font-mono text-sm tracking-widest text-white/60">•••• •••• •••• 4291</p>
            <p className="mt-2 text-sm font-semibold text-white">Sapphire Preferred</p>
          </div>

          <div
            className="relative ml-12 w-72 overflow-hidden rounded-2xl p-6 shadow-2xl"
            style={{ background: "linear-gradient(135deg, #1d1d1f, #3c3c3e)", rotate: "3deg" }}
          >
            <div className="flex items-start justify-between">
              <span className="text-xs font-bold tracking-widest text-white/70">AMEX</span>
              <div className="h-7 w-7 rounded-full border border-white/30" />
            </div>
            <p className="mt-6 font-mono text-sm tracking-widest text-white/60">•••• •••••• •0005</p>
            <p className="mt-2 text-sm font-semibold text-white">Platinum Card</p>
          </div>
        </div>

        {/* Tagline */}
        <div className="relative z-10">
          <p className="text-2xl font-semibold leading-snug text-white">
            The right card for<br />every purchase.
          </p>
          <p className="mt-2 text-sm text-indigo-200/80">
            Track your wallet. Maximize every dollar.
          </p>

          <div className="mt-8 flex gap-6">
            {[["28+", "Cards tracked"], ["3×", "Avg. reward boost"], ["$0", "Always free"]].map(([stat, label]) => (
              <div key={label}>
                <p className="text-2xl font-bold text-white">{stat}</p>
                <p className="text-xs text-indigo-200/70">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right panel — form content ──────────────────────── */}
      <div className="relative flex flex-1 flex-col items-center justify-center bg-slate-50 px-4 py-6 lg:w-3/5 lg:px-12">
        {children}
      </div>
    </div>
  );
}
