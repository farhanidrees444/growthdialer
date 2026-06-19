'use client';

const ROW1 = [
  {
    quote: 'We stopped scribbling notes mid-call. Summaries land before I hang up.',
    name: 'Maya R.',
    title: 'SDR Lead',
    company: 'B2B SaaS',
    featured: true,
  },
  {
    quote: 'Power dialer + AI briefs cut our prep time in half. The floor feels calmer.',
    name: 'Chris T.',
    title: 'Rev Ops',
    company: 'Agency',
  },
  {
    quote: 'Coaching mode let our manager whisper without jumping on every live call.',
    name: 'Priya K.',
    title: 'Sales Manager',
    company: 'Fintech',
  },
  {
    quote: 'Honest product — recording and summaries work on day one, no enterprise sales call.',
    name: 'Leo M.',
    title: 'Founder',
    company: 'Startup',
  },
];

const ROW2 = [
  {
    quote: 'Number health alerts saved us from a spam flag on our main line.',
    name: 'Jordan H.',
    title: 'AE',
    company: 'Logistics',
  },
  {
    quote: 'The AI dialer focus stages match how we actually run outbound blocks.',
    name: 'Sam W.',
    title: 'SDR',
    company: 'HR Tech',
    featured: true,
  },
  {
    quote: 'Analytics finally show connect rate and talk time in one place.',
    name: 'Alex P.',
    title: 'Head of Sales',
    company: 'Martech',
  },
  {
    quote: 'Setup took minutes. First summarized call convinced the team.',
    name: 'Riley N.',
    title: 'SDR Manager',
    company: 'Cyber',
  },
];

function Card({
  quote,
  name,
  title,
  company,
  featured,
}: (typeof ROW1)[number]) {
  return (
    <article
      className={
        featured
          ? 'marketing-hover-lift w-[320px] shrink-0 rounded-2xl border border-l-2 border-l-[#7C3AED] border-white/[0.08] bg-[#12121A] p-5'
          : 'marketing-hover-lift w-[320px] shrink-0 rounded-2xl border border-white/[0.08] bg-[#0F0F12] p-5'
      }
    >
      <span className="mb-3 inline-flex rounded-full border border-white/[0.08] bg-white/[0.035] px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-zinc-500">
        Early feedback
      </span>
      <p className="text-[15px] italic leading-relaxed text-zinc-200">&ldquo;{quote}&rdquo;</p>
      <div className="mt-4 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#7C3AED]/20 text-sm font-semibold text-[#A78BFA]">
          {name.charAt(0)}
        </span>
        <div>
          <p className="text-sm font-semibold text-[#F5F5F7]">{name}</p>
          <p className="text-[12px] text-zinc-500">
            {title} · {company}
          </p>
        </div>
      </div>
    </article>
  );
}

function TickerRow({
  items,
  reverse,
}: {
  items: typeof ROW1;
  reverse?: boolean;
}) {
  const doubled = [...items, ...items];
  return (
    <div className="relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
      <div className={`flex w-max gap-4 ${reverse ? 'marquee-track-reverse' : 'marquee-track'}`}>
        {doubled.map((t, i) => (
          <Card key={`${t.name}-${i}`} {...t} />
        ))}
      </div>
    </div>
  );
}

export function TestimonialsTicker() {
  return (
    <section className="relative overflow-hidden px-5 py-20 lg:px-8 lg:py-28">
      <div className="mx-auto mb-12 max-w-2xl text-center">
        <p className="mb-3 text-[12px] font-medium uppercase tracking-[0.2em] text-zinc-600">
          Early teams
        </p>
        <h2 className="font-display text-[clamp(2rem,4vw,3rem)] font-light tracking-tight text-[#F5F5F7]">
          Built with <span className="font-medium">outbound teams</span> in mind.
        </h2>
        <p className="mt-4 text-[15px] text-zinc-500">
          Trusted by early SDR teams — feedback from our first customers.
        </p>
      </div>
      <div className="space-y-4">
        <TickerRow items={ROW1} />
        <TickerRow items={ROW2} reverse />
      </div>
    </section>
  );
}
