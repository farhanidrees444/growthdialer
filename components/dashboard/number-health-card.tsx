'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, ChevronRight, Phone } from 'lucide-react';
import Link from 'next/link';
import { NumberHealthBadge } from '@/components/numbers/number-health-badge';
import {
  averageComputedHealth,
  formatHealthPercent,
  formatReputationScore,
  healthScoreBar,
  healthScoreColor,
  type NumberHealthTier,
} from '@/lib/numbers/health';

interface NumberStats {
  total_calls: number;
  connected: number;
  connect_rate: number;
  last_used: string | null;
}

interface NumberItem {
  id: string;
  phone_number: string;
  label: string | null;
  is_default: boolean;
  spam_status: string | null;
  computed_health?: number | null;
  reputation_score?: number | null;
  health_label?: string;
  health_tier?: NumberHealthTier;
  has_call_data?: boolean;
  has_reputation_check?: boolean;
  stats?: NumberStats;
}

function fmtPhone(p: string): string {
  const d = p.replace(/\D/g, '');
  if (d.length === 11) return `(${d.slice(1, 4)}) ${d.slice(4, 7)}-${d.slice(7)}`;
  return p;
}

export function NumberHealthCard() {
  const [numbers, setNumbers] = useState<NumberItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNumbers = async () => {
    try {
      const res = await fetch('/api/numbers/list');
      const data = await res.json() as { numbers?: NumberItem[] };
      setNumbers(data.numbers ?? []);
    } catch {
      // silent — keep previous state
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchNumbers();
    const interval = setInterval(() => void fetchNumbers(), 30_000);
    return () => clearInterval(interval);
  }, []);

  const active = numbers;
  const avgHealth = averageComputedHealth(active);
  const withData = active.filter((n) => n.computed_health !== null && n.computed_health !== undefined);
  const cleanCount = active.filter((n) => (n.spam_status ?? 'clean') === 'clean').length;
  const atRisk = active.filter((n) => n.spam_status === 'flagged' || n.spam_status === 'blocked').length;
  const needsCheck = active.filter((n) => !n.has_reputation_check).length;

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl">
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-white">Number Health</h3>
        </div>
        <Link
          href="/numbers"
          className="flex items-center gap-1 text-xs text-white/40 transition-colors hover:text-white/70"
        >
          Manage <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      {loading ? (
        <div className="flex-1 space-y-2 px-5 pb-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl border border-white/[0.04] bg-white/[0.02]" />
          ))}
        </div>
      ) : active.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-5 py-10 text-center">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.07] bg-white/[0.03]"
            style={{ background: 'linear-gradient(135deg,rgba(139,92,246,0.08),rgba(6,182,212,0.08))' }}
          >
            <Phone className="h-5 w-5 text-white/30" />
          </div>
          <p className="text-sm text-white/40">No numbers configured</p>
          <Link href="/numbers" className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors">
            Get a number →
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2 px-5 pb-4">
            {[
              {
                label: 'Avg Health',
                value: formatHealthPercent(avgHealth),
                color: healthScoreColor(avgHealth),
                hint: withData.length < active.length ? `${withData.length}/${active.length} scored` : undefined,
              },
              {
                label: 'Clean',
                value: `${cleanCount}/${active.length}`,
                color: 'text-cyan-400',
              },
              {
                label: 'At Risk',
                value: String(atRisk),
                color: atRisk > 0 ? 'text-red-400' : 'text-white/50',
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-white/[0.04] bg-white/[0.02] px-3 py-2.5 text-center"
              >
                <p className={`text-lg font-light tabular-nums leading-none ${stat.color}`}>{stat.value}</p>
                <p className="mt-1 text-[9px] uppercase tracking-wider text-white/35">{stat.label}</p>
                {stat.hint && <p className="mt-0.5 text-[9px] text-white/25">{stat.hint}</p>}
              </div>
            ))}
          </div>

          {needsCheck > 0 && (
            <p className="px-5 pb-3 text-[11px] text-slate-500">
              {needsCheck} number{needsCheck === 1 ? '' : 's'} need a spam check for reputation score.
            </p>
          )}

          <div className="flex-1 space-y-1.5 overflow-y-auto px-5 pb-5">
            {active.slice(0, 6).map((num, i) => {
              const health = num.computed_health ?? null;
              const tier = num.health_tier ?? 'unknown';
              const label = num.health_label ?? 'New';
              const barColor = healthScoreBar(health);
              const barWidth = health ?? 0;

              return (
                <motion.div
                  key={num.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.2 }}
                  className="flex items-center gap-3 rounded-xl border border-white/[0.04] bg-white/[0.02] px-3 py-2.5 transition-colors hover:bg-white/[0.04]"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate font-mono text-sm text-white/90">
                        {fmtPhone(num.phone_number)}
                      </span>
                      <NumberHealthBadge label={label} tier={tier} />
                    </div>
                    {num.label && (
                      <p className="truncate text-[10px] text-white/30">{num.label}</p>
                    )}
                    <div className="mt-1 flex items-center justify-between gap-2 text-[10px] text-white/35">
                      <span>Health {formatHealthPercent(health)}</span>
                      <span>Rep. {formatReputationScore(num.reputation_score ?? null)}</span>
                    </div>
                    <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/[0.05]">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: health === null ? '8%' : `${barWidth}%` }}
                        transition={{ delay: i * 0.05 + 0.2, duration: 0.5, ease: 'easeOut' }}
                        className={`h-full rounded-full ${barColor} ${health === null ? 'opacity-40' : ''}`}
                      />
                    </div>
                  </div>

                  {num.is_default && (
                    <span className="shrink-0 text-[9px] font-bold text-cyan-400">DEF</span>
                  )}
                </motion.div>
              );
            })}
          </div>

          {active.length > 6 && (
            <Link
              href="/numbers"
              className="block border-t border-white/[0.04] px-5 py-3 text-center text-xs text-white/40 transition-colors hover:text-white/60"
            >
              View all {active.length} numbers →
            </Link>
          )}
        </>
      )}
    </div>
  );
}
