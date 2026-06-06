import Link from 'next/link';
import { MiniWave } from './LiveWaveform';
import { APP_SIGNUP, FOOTER_COLUMNS, SOCIAL_LINKS, STATUS_URL } from '@/lib/marketing/navigation';

function TwitterIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.259 5.631 5.905-5.631Zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function LinkedinIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function GithubIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

function YoutubeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

const SOCIAL_ICONS = [TwitterIcon, LinkedinIcon, GithubIcon, YoutubeIcon];

export function SiteFooter() {
  return (
    <footer className="relative overflow-hidden px-5 pb-10 pt-16 lg:px-8">
      <div
        aria-hidden
        className="mb-12 h-px w-full bg-gradient-to-r from-transparent via-[#7C3AED]/40 to-transparent"
      />

      <p
        aria-hidden
        className="pointer-events-none absolute bottom-8 left-1/2 -translate-x-1/2 select-none font-display text-[clamp(4rem,14vw,11rem)] font-semibold leading-none tracking-tighter text-white/[0.03]"
      >
        GrowthDialer
      </p>

      <div className="relative mx-auto grid max-w-7xl gap-10 sm:grid-cols-2 lg:grid-cols-6">
        <div className="sm:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03]">
              <MiniWave className="scale-90" />
            </span>
            <span className="font-display text-[15px] font-semibold tracking-tight text-[#F5F5F7]">
              GrowthDialer
            </span>
          </div>
          <p className="mt-4 max-w-xs text-[13px] leading-relaxed text-zinc-500">
            The AI sales dialer that turns every conversation into searchable revenue intelligence.
          </p>
          <div className="mt-5 flex items-center gap-2">
            {SOCIAL_LINKS.map((social, i) => {
              const Icon = SOCIAL_ICONS[i];
              return (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.02] text-zinc-500 transition-all hover:translate-x-0.5 hover:border-white/[0.12] hover:text-[#F5F5F7]"
                >
                  <Icon />
                </a>
              );
            })}
          </div>
          <a
            href={APP_SIGNUP}
            className="mt-5 inline-flex text-[13px] font-medium text-[#A78BFA] transition-colors hover:text-[#C4B5FD]"
          >
            Start free →
          </a>
        </div>

        {FOOTER_COLUMNS.map((col) => (
          <div key={col.heading}>
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.1em] text-zinc-600">
              {col.heading}
            </p>
            <ul className="space-y-2.5">
              {col.links.map((l) => (
                <li key={l.label}>
                  <Link
                    href={l.href}
                    className="inline-block text-[13px] text-zinc-400 transition-all hover:translate-x-0.5 hover:text-[#F5F5F7]"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="relative mx-auto mt-12 flex max-w-7xl flex-col items-center justify-between gap-4 border-t border-white/[0.05] pt-7 sm:flex-row">
        <p className="text-[12px] text-zinc-600">
          © {new Date().getFullYear()} GrowthDialer. All rights reserved.
        </p>
        <Link
          href={STATUS_URL}
          className="inline-flex items-center gap-2 text-[12px] text-zinc-500 transition-colors hover:text-zinc-300"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-40" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          All systems operational
        </Link>
        <div className="flex flex-wrap items-center justify-center gap-4 text-[12px]">
          <Link href="/privacy" className="text-zinc-500 transition-colors hover:text-[#F5F5F7]">
            Privacy
          </Link>
          <Link href="/terms" className="text-zinc-500 transition-colors hover:text-[#F5F5F7]">
            Terms
          </Link>
          <Link href="/status" className="text-zinc-500 transition-colors hover:text-[#F5F5F7]">
            Status
          </Link>
        </div>
      </div>
    </footer>
  );
}
