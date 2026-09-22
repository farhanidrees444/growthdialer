import { Check, BellPlus } from 'lucide-react';
import { INTEGRATION_BRANDS } from '@/lib/marketing/integration-brands';
import { cn } from '@/lib/utils';

/**
 * Integration flow — illustrated hub-and-spoke.
 * GrowthDialer hub in the middle, HubSpot connected live (solid line),
 * three more connectors honestly labeled "In development" (dotted lines).
 * Uses the REAL Simple Icons brand marks already in use on the site.
 */
export function IntegrationsFlowVisual() {
  const hubspot = INTEGRATION_BRANDS.find((b) => b.id === 'hubspot');
  const upcoming = INTEGRATION_BRANDS.filter((b) => !b.live).slice(0, 3);
  if (!hubspot) return null;
  const HubspotIcon = hubspot.Icon;

  return (
    <div
      role="img"
      aria-label="Illustrated integration flow: HubSpot connected live, more connectors in development"
      className="relative overflow-hidden rounded-[1.6rem] bg-[#160d26] px-6 py-10 sm:px-10"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-100"
        style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.09) 1.4px, transparent 1.4px)',
          backgroundSize: '22px 22px',
        }}
      />
      {/* connector lines (desktop) */}
      <svg
        aria-hidden
        className="pointer-events-none absolute inset-0 hidden h-full w-full md:block"
        preserveAspectRatio="none"
        viewBox="0 0 100 100"
      >
        <line x1="24" y1="50" x2="44" y2="50" stroke="#1fd47a" strokeWidth="0.5" strokeDasharray="0.1 1.6" strokeLinecap="round" />
        <line x1="56" y1="50" x2="72" y2="26" stroke="#45c4b0" strokeWidth="0.4" strokeDasharray="0.1 1.6" strokeLinecap="round" opacity="0.7" />
        <line x1="56" y1="50" x2="72" y2="50" stroke="#45c4b0" strokeWidth="0.4" strokeDasharray="0.1 1.6" strokeLinecap="round" opacity="0.7" />
        <line x1="56" y1="50" x2="72" y2="74" stroke="#45c4b0" strokeWidth="0.4" strokeDasharray="0.1 1.6" strokeLinecap="round" opacity="0.7" />
      </svg>

      <div className="relative grid items-center gap-6 md:grid-cols-[1fr_auto_1fr]">
        {/* live connector */}
        <div className="flex justify-center md:justify-end">
          <div className="w-full max-w-[220px] rounded-2xl border border-[#1fd47a]/40 bg-[#fbf8f2] p-5 text-center shadow-[0_18px_40px_-16px_rgba(0,0,0,0.5)]">
            <span
              className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl text-white"
              style={{ backgroundColor: hubspot.color }}
            >
              <HubspotIcon className="h-6 w-6" />
            </span>
            <p className="mt-3 text-[15px] font-bold text-zinc-950">{hubspot.name}</p>
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-[0.1em] text-emerald-800">
              <Check className="h-3 w-3" /> Live
            </p>
          </div>
        </div>

        {/* hub */}
        <div className="flex justify-center">
          <div className="rounded-2xl bg-[#fbf8f2] px-7 py-5 text-center shadow-[0_18px_40px_-16px_rgba(0,0,0,0.5)]">
            <p className="font-mono text-[10.5px] font-bold uppercase tracking-[0.22em] text-[#6d28d9]">
              Hub
            </p>
            <p className="mt-1 font-display text-xl font-bold text-zinc-950">GrowthDialer</p>
          </div>
        </div>

        {/* in-development connectors */}
        <div className="grid gap-4 sm:grid-cols-3 md:grid-cols-1 lg:grid-cols-1">
          {upcoming.map((b) => {
            const Icon = b.Icon;
            return (
              <div
                key={b.id}
                className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.05] p-4 opacity-90"
              >
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white grayscale"
                  style={{ backgroundColor: b.color }}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-semibold text-white">{b.name}</p>
                  <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-white/[0.08] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-400">
                    <BellPlus className="h-3 w-3" /> In development
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <p className={cn('relative mt-8 text-center font-mono text-[11px] uppercase tracking-[0.18em] text-[#b9a9d4]')}>
        Calls, dispositions &amp; notes sync on every disposition
      </p>
    </div>
  );
}
