import Link from 'next/link';
import { INTEGRATION_BRANDS } from '@/lib/marketing/integration-brands';

export function IntegrationsMarquee() {
  // Duplicate the set so the CSS -50% translate loops seamlessly.
  const row = [...INTEGRATION_BRANDS, ...INTEGRATION_BRANDS];

  return (
    <section id="integrations" className="relative px-5 py-16 lg:px-8 lg:py-24" aria-label="Integrations">
      <div className="mx-auto mb-10 max-w-2xl text-center">
        <p className="mb-3 text-[12px] font-medium uppercase tracking-[0.2em] text-zinc-600">
          Integrations
        </p>
        <h2 className="font-display text-[clamp(1.8rem,3.5vw,2.75rem)] font-light leading-[1.1] tracking-tight text-[#F5F5F7]">
          HubSpot is live. The rest of your stack is next.
        </h2>
        <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-zinc-500">
          HubSpot connects today; other CRM and automation tools are on the waitlist — every dial still logs in GrowthDialer.
        </p>
        <Link
          href="/integrations"
          className="mt-5 inline-flex text-sm font-medium text-[#F5F5F7] underline-offset-4 hover:underline"
        >
          See all integrations →
        </Link>
      </div>

      {/* Marquee — pure-CSS loop (runs on every viewport), edges masked into bg */}
      <div className="relative mx-auto max-w-6xl overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
        <ul className="marquee-track flex w-max items-center gap-3">
          {row.map((b, i) => {
            const { Icon } = b;
            return (
              <li
                key={`${b.id}-${i}`}
                className="group relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.05] p-3 backdrop-blur-xl sm:h-[4.5rem] sm:w-[4.5rem] sm:p-3.5"
                style={{ ['--brand']: b.color } as React.CSSProperties}
              >
                {/* Localized radial glow on hover */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  style={{ background: `radial-gradient(circle at 50% 50%, ${b.color}2e, transparent 70%)` }}
                />
                <Icon
                  aria-hidden
                  className="relative h-8 w-8 shrink-0 transition-transform duration-300 group-hover:scale-105 sm:h-9 sm:w-9"
                  style={{ color: b.color }}
                />
                <span className="sr-only">{b.name}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
