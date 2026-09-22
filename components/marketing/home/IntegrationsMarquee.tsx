import Link from 'next/link';
import { INTEGRATION_BRANDS } from '@/lib/marketing/integration-brands';
import { Reveal } from '@/components/ui/reveal';

export function IntegrationsMarquee() {
  // Duplicate the set so the CSS -50% translate loops seamlessly.
  const row = [...INTEGRATION_BRANDS, ...INTEGRATION_BRANDS];

  return (
    <section id="integrations" className="relative px-5 py-16 lg:px-8 lg:py-24" aria-label="Integrations">
      <Reveal className="mx-auto mb-10 max-w-2xl text-center">
        <p className="mk-eyebrow justify-center">Integrations</p>
        <h2 className="mk-h-section">
          HubSpot is live. The rest of your stack is next.
        </h2>
        <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-zinc-600">
          HubSpot connects today; other CRM and automation tools are on the waitlist. Every dial still logs in GrowthDialer.
        </p>
        <Link
          href="/integrations"
          className="mt-5 inline-flex text-sm font-medium text-zinc-950 underline underline-offset-4 decoration-zinc-300 hover:decoration-zinc-950"
        >
          See all integrations →
        </Link>
      </Reveal>

      {/* Marquee — pure-CSS loop (runs on every viewport), edges masked into bg */}
      <div className="relative mx-auto max-w-6xl overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
        <ul className="marquee-track flex w-max items-center gap-3">
          {row.map((b, i) => {
            const { Icon } = b;
            return (
              <li
                key={`${b.id}-${i}`}
                className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-zinc-950/[0.08] bg-white p-3 shadow-[0_1px_2px_rgba(9,9,11,0.05)] transition-shadow hover:shadow-[0_8px_24px_rgba(9,9,11,0.10)] sm:h-[4.5rem] sm:w-[4.5rem] sm:p-3.5"
                style={{ ['--brand']: b.color } as React.CSSProperties}
              >
                <Icon
                  aria-hidden
                  className="relative h-8 w-8 shrink-0 transition-transform duration-300 hover:scale-105 sm:h-9 sm:w-9"
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
