/** Layered marketing canvas — base, radial glow, grid. Grain lives in Grain.tsx */
export function BackgroundSystem() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10" aria-hidden>
      <div className="absolute inset-0 bg-[#08080A]" />
      <div
        className="absolute left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(124,58,237,0.12) 0%, transparent 70%)',
        }}
      />
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.35]" />
    </div>
  );
}
