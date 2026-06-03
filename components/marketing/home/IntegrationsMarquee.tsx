import type { IconType } from 'react-icons';
import {
  SiSalesforce, SiHubspot, SiSlack, SiZoom, SiNotion, SiGmail,
  SiZapier, SiStripe, SiTwilio, SiCalendly, SiIntercom, SiZendesk,
} from 'react-icons/si';

// PLANNED integrations — shown honestly as "coming soon". Real brand logos,
// monochrome by default and illuminating to (visible) brand color on hover.
// `color` uses each brand's official hex, brightened only where the official
// tone is near-black and would be invisible on the matte canvas (Slack,
// Notion, Zendesk).
type Brand = { name: string; Icon: IconType; color: string };
const PLANNED: Brand[] = [
  { name: 'Salesforce', Icon: SiSalesforce, color: '#00A1E0' },
  { name: 'HubSpot', Icon: SiHubspot, color: '#FF7A59' },
  { name: 'Slack', Icon: SiSlack, color: '#36C5F0' },
  { name: 'Zoom', Icon: SiZoom, color: '#0B5CFF' },
  { name: 'Notion', Icon: SiNotion, color: '#FFFFFF' },
  { name: 'Gmail', Icon: SiGmail, color: '#EA4335' },
  { name: 'Zapier', Icon: SiZapier, color: '#FF4F00' },
  { name: 'Stripe', Icon: SiStripe, color: '#635BFF' },
  { name: 'Twilio', Icon: SiTwilio, color: '#F22F46' },
  { name: 'Calendly', Icon: SiCalendly, color: '#006BFF' },
  { name: 'Intercom', Icon: SiIntercom, color: '#1F8DED' },
  { name: 'Zendesk', Icon: SiZendesk, color: '#2AB7A9' },
];

export function IntegrationsMarquee() {
  // Duplicate the set so the CSS -50% translate loops seamlessly.
  const row = [...PLANNED, ...PLANNED];

  return (
    <section id="integrations" className="relative px-5 py-16 lg:px-8 lg:py-24" aria-label="Planned integrations">
      <div className="mx-auto mb-10 max-w-2xl text-center">
        <p className="mb-3 text-[12px] font-medium uppercase tracking-[0.2em] text-zinc-600">
          Integrations — coming soon
        </p>
        <h2 className="font-display text-[clamp(1.8rem,3.5vw,2.75rem)] font-light leading-[1.1] tracking-tight text-[#F5F5F7]">
          Built to fit the tools you&apos;ll connect.
        </h2>
        <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-zinc-500">
          These integrations are planned, not live yet. Today, every call is
          captured and analyzed inside GrowthDialer.
        </p>
      </div>

      {/* Marquee — pure-CSS loop (runs on every viewport), edges masked into bg */}
      <div className="relative mx-auto max-w-6xl overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
        <ul className="marquee-track flex w-max items-center gap-3">
          {row.map((b, i) => {
            const { Icon } = b;
            return (
              <li
                key={`${b.name}-${i}`}
                className="group relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl sm:h-[4.5rem] sm:w-[4.5rem]"
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
                  className="relative h-6 w-6 text-zinc-500 opacity-40 transition-all duration-300 group-hover:opacity-100 group-hover:[color:var(--brand)] sm:h-7 sm:w-7"
                />
                <span className="sr-only">{b.name} — integration coming soon</span>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
