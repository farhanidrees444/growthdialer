'use client';

import { ReactNode } from 'react';

export function PremiumLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-background">
      {/* ─── Radial Gradient Base ─── */}
      <div
        className="absolute inset-0 -z-20"
        style={{
          background: `
            radial-gradient(circle at 30% 50%, rgba(139, 92, 246, 0.08) 0%, transparent 50%),
            radial-gradient(circle at 70% 70%, rgba(6, 182, 212, 0.06) 0%, transparent 50%)
          `,
        }}
      />

      {/* ─── Micro-Dot Matrix Pattern ─── */}
      <div
        className="absolute inset-0 -z-20 opacity-40"
        style={{
          backgroundImage: `
            linear-gradient(0deg, transparent 24%, rgba(255, 255, 255, 0.02) 25%, rgba(255, 255, 255, 0.02) 26%, transparent 27%, transparent 74%, rgba(255, 255, 255, 0.02) 75%, rgba(255, 255, 255, 0.02) 76%, transparent 77%, transparent),
            linear-gradient(90deg, transparent 24%, rgba(255, 255, 255, 0.02) 25%, rgba(255, 255, 255, 0.02) 26%, transparent 27%, transparent 74%, rgba(255, 255, 255, 0.02) 75%, rgba(255, 255, 255, 0.02) 76%, transparent 77%, transparent)
          `,
          backgroundSize: '50px 50px',
        }}
      />

      {/* ─── Ambient Top-Left Blur Orb ─── */}
      <div
        className="pointer-events-none absolute -top-40 -left-40 h-80 w-80 rounded-full blur-3xl opacity-20"
        style={{
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.3) 0%, transparent 70%)',
        }}
      />

      {/* ─── Ambient Top-Right Blur Orb ─── */}
      <div
        className="pointer-events-none absolute -top-40 -right-40 h-80 w-80 rounded-full blur-3xl opacity-15"
        style={{
          background: 'radial-gradient(circle, rgba(6, 182, 212, 0.25) 0%, transparent 70%)',
        }}
      />

      {/* ─── Content Container ─── */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
