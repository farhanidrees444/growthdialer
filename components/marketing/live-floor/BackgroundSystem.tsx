/** Layered marketing canvas — matte base, radial glow stack, deep grid and soft vignettes. */
export function BackgroundSystem() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10" aria-hidden>
      <div className="absolute inset-0 bg-[var(--marketing-canvas)]" />
      <div
        className="marketing-orb-violet absolute left-1/2 top-[-10%] h-[620px] w-[min(92vw,980px)] -translate-x-1/2 rounded-full blur-3xl"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(139,92,246,0.22) 0%, rgba(139,92,246,0.08) 38%, transparent 72%)',
        }}
      />
      <div
        className="marketing-orb-cyan absolute right-[-12%] top-[28%] h-[520px] w-[520px] rounded-full blur-3xl"
        style={{
          background:
            'radial-gradient(circle, rgba(6,182,212,0.14) 0%, rgba(6,182,212,0.05) 42%, transparent 72%)',
        }}
      />
      <div
        className="absolute bottom-[-18%] left-[-12%] h-[560px] w-[560px] rounded-full blur-3xl"
        style={{
          background:
            'radial-gradient(circle, rgba(6,182,212,0.10) 0%, rgba(139,92,246,0.035) 42%, transparent 70%)',
        }}
      />
      <div className="marketing-grid-deep absolute inset-0 opacity-[0.4]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,transparent_48%,rgba(0,0,0,0.72)_100%)]" />
      <div className="absolute inset-x-0 top-0 h-44 bg-gradient-to-b from-black/60 to-transparent" />
    </div>
  );
}
