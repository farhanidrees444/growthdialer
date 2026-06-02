'use client';

/**
 * Subtle film grain overlay (~3% opacity) for a cinematic, high-end feel.
 * Fixed, pointer-events-none, sits above the canvas but below content.
 */
export function Grain() {
  const noise = `<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>`;
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[1] opacity-[0.035] mix-blend-overlay"
      style={{ backgroundImage: `url("data:image/svg+xml,${noise}")`, backgroundSize: '160px 160px' }}
    />
  );
}
