import { PhoneCall, Sparkles, Users, ShieldCheck, BarChart3, Zap } from 'lucide-react';
import { Reveal } from '@/components/ui/reveal';

const CARDS = [
  {
    icon: PhoneCall,
    title: 'A dialer, not a dialer app tab',
    body: 'Calling is the whole product. One click to dial, dispositions and notes flow with it.',
  },
  {
    icon: Sparkles,
    title: 'AI notes you don\u2019t have to write',
    body: 'Summaries, action items and intent land on every call so reps can just talk.',
  },
  {
    icon: Users,
    title: 'Built for sales teams',
    body: 'Live floor, manager listening view and team analytics out of the box.',
  },
  {
    icon: ShieldCheck,
    title: 'Answer-ready numbers',
    body: 'Number health and local presence keep your calls from landing in spam.',
  },
  {
    icon: BarChart3,
    title: 'Analytics that matter',
    body: 'Connect rate, talk time and sentiment — reported automatically, no spreadsheets.',
  },
  {
    icon: Zap,
    title: 'Live in minutes',
    body: 'Import a CSV, claim a number and start dialing. No onboarding call required.',
  },
];

export function ValueProps() {
  return (
    <section id="why-growthdialer" className="relative scroll-mt-24 px-5 py-20 lg:px-8 lg:py-28">
      <div className="mx-auto max-w-7xl">
        <Reveal className="mx-auto mb-14 max-w-2xl text-center">
          <p className="mk-eyebrow justify-center">Why GrowthDialer</p>
          <h2 className="mk-h-section">
            Built for the way <span className="font-semibold">outbound actually works.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-[16px] leading-relaxed text-zinc-600">
            The fundamentals, done right — no bloated platform, just the dialer workflow your team will actually use.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {CARDS.map((c, i) => {
            const Icon = c.icon;
            return (
              <Reveal key={c.title} delay={(i % 3) * 70}>
                <article className="mk-card mk-card-hover h-full p-6">
                  <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[#7C3AED]/10 text-[#6D28D9]">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="text-[16px] font-semibold text-zinc-950">{c.title}</h3>
                  <p className="mt-2 text-[14px] leading-relaxed text-zinc-600">{c.body}</p>
                </article>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
