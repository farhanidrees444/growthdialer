'use client';

import { Fragment } from 'react';
import { motion } from 'framer-motion';
import { Check, Minus } from 'lucide-react';
import { EASE_OUT } from '@/components/marketing/live-floor/motion';

type Cell = boolean | string | 'soon';

const PLANS = ['Starter', 'Pro', 'Team', 'Enterprise'];

const GROUPS: { group: string; rows: { label: string; cells: [Cell, Cell, Cell, Cell] }[] }[] = [
  {
    group: 'Workspace',
    rows: [
      { label: 'Seats included', cells: ['1', 'Up to 3', 'Up to 10', 'Unlimited'] },
      { label: 'Team workspaces & roles', cells: [false, false, true, true] },
      { label: 'Manager team analytics', cells: [false, false, true, true] },
    ],
  },
  {
    group: 'Calling',
    rows: [
      { label: 'Outbound calling (US & Canada)', cells: [true, true, true, true] },
      { label: 'Web dialer + click-to-call', cells: [true, true, true, true] },
      { label: 'Inbound calling', cells: [false, true, true, true] },
      { label: 'AI Dialer (3-mode Focus Stage)', cells: [false, true, true, true] },
      { label: 'Power Dialer', cells: [false, true, true, true] },
      { label: 'Live manager coaching', cells: [false, true, true, true] },
    ],
  },
  {
    group: 'Numbers',
    rows: [
      { label: 'Local numbers', cells: ['1', 'Multiple', 'Multiple', 'Custom'] },
      { label: 'Number health & spam monitoring', cells: [false, true, true, true] },
    ],
  },
  {
    group: 'Recording & AI',
    rows: [
      { label: 'Call recording', cells: [true, true, true, true] },
      { label: 'Call transcription', cells: [true, true, true, true] },
      { label: 'AI call summaries', cells: [true, true, true, true] },
      { label: 'AI call brief before dial', cells: [false, true, true, true] },
      { label: 'AI sentiment & intent', cells: [false, true, true, true] },
    ],
  },
  {
    group: 'Data & insights',
    rows: [
      { label: 'Leads management', cells: [true, true, true, true] },
      { label: 'Analytics', cells: ['Basic', 'Advanced', 'Advanced', 'Advanced'] },
    ],
  },
  {
    group: 'Platform',
    rows: [
      { label: 'Support', cells: ['Email', 'Email', 'Priority', 'Dedicated'] },
      { label: 'CRM integrations', cells: [false, false, 'soon', true] },
      { label: 'Public API', cells: [false, false, 'soon', true] },
    ],
  },
];

function CellContent({ v, popular }: { v: Cell; popular: boolean }) {
  if (v === true)
    return <Check className={`mx-auto h-4 w-4 ${popular ? 'text-violet-400' : 'text-zinc-400'}`} />;
  if (v === false) return <Minus className="mx-auto h-4 w-4 text-zinc-700" />;
  if (v === 'soon')
    return (
      <span className="inline-block rounded border border-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-600">
        Soon
      </span>
    );
  return <span className="text-[13px] text-zinc-400">{v}</span>;
}

export function ComparisonTable() {
  return (
    <section className="border-t border-zinc-800/60 px-5 py-16 lg:px-8 lg:py-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.55, ease: EASE_OUT }}
        className="mx-auto max-w-2xl text-center"
      >
        <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-600">
          Compare plans
        </p>
        <h2 className="font-display text-[clamp(1.75rem,3.5vw,2.75rem)] font-light leading-[1.08] tracking-tight text-zinc-50">
          Everything, side by side.
        </h2>
      </motion.div>

      <div className="mx-auto mt-10 max-w-6xl overflow-x-auto rounded-xl border border-zinc-800/60 bg-zinc-900/20 backdrop-blur-md lg:overflow-visible">
        <table className="w-full min-w-[760px] border-collapse">
          <thead className="sticky top-16 z-20">
            <tr>
              <th className="bg-zinc-950/95 py-4 pl-5 pr-4 text-left align-bottom backdrop-blur-md">
                <span className="text-[13px] font-medium text-zinc-500">Features</span>
              </th>
              {PLANS.map((p, i) => (
                <th
                  key={p}
                  className={`bg-zinc-950/95 px-4 py-4 text-center align-bottom backdrop-blur-md ${
                    i === 1 ? 'border-x border-violet-500/20 bg-violet-500/[0.04]' : ''
                  }`}
                >
                  <span
                    className={`text-[14px] font-semibold ${i === 1 ? 'text-violet-300' : 'text-zinc-100'}`}
                  >
                    {p}
                  </span>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {GROUPS.map((g) => (
              <Fragment key={g.group}>
                <tr>
                  <td colSpan={5} className="pb-2 pl-5 pt-6">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-600">
                      {g.group}
                    </span>
                  </td>
                </tr>
                {g.rows.map((row) => (
                  <tr
                    key={row.label}
                    className="group border-t border-zinc-800/40 transition-colors hover:bg-zinc-900/30"
                  >
                    <td className="py-3 pl-5 pr-4 text-[13px] text-zinc-400">{row.label}</td>
                    {row.cells.map((c, i) => (
                      <td
                        key={i}
                        className={`px-4 py-3 text-center ${
                          i === 1 ? 'border-x border-violet-500/10 bg-violet-500/[0.03]' : ''
                        }`}
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
