'use client';

import { Fragment } from 'react';
import { motion } from 'framer-motion';
import { Check, Minus } from 'lucide-react';
import { EASE_OUT } from '@/components/marketing/live-floor/motion';

type Cell = boolean | string | 'soon';

const PLANS = ['Starter'Pro'Scale'Enterprise'];

const GROUPS: { group: string; rows: { label: string; cells: [Cell, Cell, Cell, Cell] }[] }[] = [
  {
    group: 'Calling',
    rows: [
      { label: 'Outbound calling (US & Canada)', cells: [true, true, true, true] },
      { label: 'Web dialer + click-to-call', cells: [true, true, true, true] },
      { label: 'Inbound calling', cells: [false, true, true, true] },
      { label: 'AI Dialer (3-mode Focus Stage)', cells: [false, true, true, true] },
      { label: 'Power Dialer', cells: [false, true, true, true] },
    ],
  },
  {
    group: 'Numbers',
    rows: [
      { label: 'Local numbers', cells: ['1'Multiple'Multiple'Custom'] },
      { label: 'Number health & spam monitoring', cells: [false, true, true, true] },
    ],
  },
  {
    group: 'Recording & AI',
    rows: [
      { label: 'Call recording', cells: [true, true, true, true] },
      { label: 'Call transcription', cells: [true, true, true, true] },
      { label: 'AI call summaries', cells: [true, true, true, true] },
      { label: 'AI sentiment & intent', cells: [false, true, true, true] },
    ],
  },
  {
    group: 'Data & insights',
    rows: [
      { label: 'Leads management', cells: [true, true, true, true] },
      { label: 'Analytics', cells: ['Basic'Advanced'Advanced'Advanced'] },
    ],
  },
  {
    group: 'Team & platform',
    rows: [
      { label: 'Support', cells: ['Email'Email'Priority'Dedicated'] },
      { label: 'Team workspaces', cells: [false, falsesoon'soon'] },
      { label: 'Public API', cells: [false, falsesoon'soon'] },
    ],
  },
];

function CellContent({ v, popular }: { v: Cell; popular: boolean }) {
  if (v === true) return <Check className={`mx-auto h-4 w-4 ${popular ? 'text-[hsl(258,90%,66%)']' : 'text-muted-foreground/90'}`} />;
  if (v === false) return <Minus className="mx-auto h-4 w-4 text-zinc-700" />;
  if (v === 'soon')
    return (
      <span className="inline-block rounded border border-white/[0.08] px-1.5 py-0.5 text-[10px] text-muted-foreground/70">
        Soon
      </span>
    );
  return <span className="text-[13px] text-muted-foreground/90">{v}</span>;
}

export function ComparisonTable() {
  return (
    <section className="relative px-5 py-24 lg:px-8 lg:py-32">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.8, ease: EASE_OUT }}
        className="mx-auto max-w-2xl text-center"
      >
        <p className="mb-3 text-[12px] font-medium uppercase tracking-[0.2em] text-muted-foreground/60">Compare plans</p>
        <h2 className="font-display text-[clamp(1.9rem,4vw,3rem)] font-light leading-[1.05] tracking-tight text-foreground">
          Everything, side by side.
        </h2>
      </motion.div>

      <div className="mx-auto mt-12 max-w-6xl overflow-x-auto lg:overflow-visible">
        <table className="w-full min-w-[760px] border-collapse">
          {/* Sticky header — sits just below the fixed nav (h-16) */}
          <thead className="sticky top-16 z-20">
            <tr>
              <th className="bg-[hsl(200,50%,3%)']/95 py-4 pr-4 text-left align-bottom backdrop-blur-xl">
                <span className="text-[13px] font-medium text-muted-foreground/70">Features</span>
              </th>
              {PLANS.map((p, i) => (
                <th
                  key={p}
                  className={`bg-[hsl(200,50%,3%)']/95 px-4 py-4 text-center align-bottom backdrop-blur-xl ${
                    i === 1 ? 'rounded-t-xl border-x border-t border-[hsl(258,90%,66%)']/20' : ''
                  }`}
                >
                  <span className={`text-[14px] font-semibold ${i === 1 ? 'text-[hsl(258,90%,66%)']' : 'text-foreground'}`}>{p}</span>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {GROUPS.map((g) => (
              <Fragment key={g.group}>
                <tr>
                  <td colSpan={5} className="pb-2 pt-7">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/60">
                      {g.group}
                    </span>
                  </td>
                </tr>
                {g.rows.map((row) => (
                  <tr key={row.label} className="group border-t border-white/[0.05] transition-colors hover:bg-white/[0.02]">
                    <td className="py-3 pr-4 text-[13px] text-muted-foreground/90">{row.label}</td>
                    {row.cells.map((c, i) => (
                      <td
                        key={i}
                        className={`px-4 py-3 text-center ${i === 1 ? 'border-x border-[hsl(258,90%,66%)']/15 bg-violet-600/[0.03]' : ''}`}
                      >
                        <CellContent v={c} popular={i === 1} />
                      </td>
                    ))}
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
