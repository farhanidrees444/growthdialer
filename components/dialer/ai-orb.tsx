'use client';

import { motion } from 'framer-motion';

const PARTICLES = [
  { x: -45, y: -30, delay: 0 },
  { x: 40, y: -38, delay: 0.8 },
  { x: 48, y: 28, delay: 1.6 },
  { x: -35, y: 42, delay: 2.4 },
];

export function AiOrb() {
  return (
    <div className="relative flex items-center justify-center w-32 h-32 mx-auto">
      {/* Outer glow ring */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)' }}
        animate={{ scale: [1, 1.12, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Core orb */}
      <motion.div
        className="relative w-24 h-24 rounded-full"
        style={{
          background: 'radial-gradient(135deg, rgba(124,58,237,0.35) 0%, rgba(6,182,212,0.20) 60%, transparent 100%)',
          boxShadow: '0 0 40px rgba(124,58,237,0.25), 0 0 80px rgba(6,182,212,0.10), inset 0 0 20px rgba(124,58,237,0.15)',
          border: '1px solid rgba(124,58,237,0.3)',
        }}
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      >
        {/* Inner shimmer */}
        <motion.div
          className="absolute inset-2 rounded-full"
          style={{ background: 'radial-gradient(circle at 35% 35%, rgba(255,255,255,0.12) 0%, transparent 60%)' }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.div>

      {/* Floating particles */}
      {PARTICLES.map((p, i) => (
        <motion.div
          key={i}
          className="absolute w-1.5 h-1.5 rounded-full bg-cyan-400/60"
          style={{ x: p.x, y: p.y }}
          animate={{
            y: [p.y, p.y - 8, p.y],
            opacity: [0.4, 0.9, 0.4],
          }}
          transition={{ duration: 3, repeat: Infinity, delay: p.delay, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}
