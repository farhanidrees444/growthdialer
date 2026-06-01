import Link from 'next/link';
import { MiniWave } from './LiveWaveform';

const APP_URL = 'https://app.growthdialer.com';

const FOOTER_COLS = [
  {
    heading: 'Product',
    links: [
      { label: 'Features', href: '/#features' },
      { label: 'Pricing', href: '/pricing' },
      { label: 'Docs', href: '/docs' },
      { label: 'Changelog', href: '/changelog' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'About', href: '/about' },
      { label: 'Customers', href: '/customers' },
      { label: 'Careers', href: '/careers' },
      { label: 'Contact', href: '/contact-sales' },
    ],
  },
  {
    heading: 'Legal',
    links: [
      { label: 'Privacy', href: '/privacy' },
      { label: 'Terms', href: '/terms' },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="relative border-t border-white/[0.06] px-5 py-14 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-10 sm:grid-cols-2 lg:grid-cols-[1.5fr_repeat(3,1fr)]">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03]">
              <MiniWave className="scale-90" />
            </span>
            <span className="text-[15px] font-medium tracking-tight text-[#F5F5F7]">GrowthDialer</span>
          </div>
          <p className="mt-4 max-w-xs text-[13px] leading-relaxed text-zinc-500">
            The AI sales dialer that turns every conversation into searchable revenue intelligence.
          </p>
        </div>

        {FOOTER_COLS.map((col) => (
          <div key={col.heading}>
            <p className="mb-4 text-[12px] font-medium uppercase tracking-[0.15em] text-zinc-600">
              {col.heading}
            </p>
            <ul className="space-y-2.5">
              {col.links.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="text-[13px] text-zinc-400 transition-colors hover:text-[#F5F5F7]">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mx-auto mt-12 flex max-w-7xl flex-col items-center justify-between gap-4 border-t border-white/[0.06] pt-7 sm:flex-row">
        <p className="text-[12px] text-zinc-600">
          © {new Date().getFullYear()} GrowthDialer. All rights reserved.
        </p>
        <a href={APP_URL} className="text-[12px] text-zinc-500 transition-colors hover:text-[#F5F5F7]">
          app.growthdialer.com
        </a>
      </div>
    </footer>
  );
}
