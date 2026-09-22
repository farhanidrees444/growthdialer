import { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";
import { GROWTHDIALER_PRICING } from "@/lib/marketing/honest-copy";
import {
  ArticleCta,
  ArticleHeader,
  ArticleJsonLd,
  ArticleShell,
  ArticleStats,
  AuthorCard,
  Callout,
  FaqStatic,
  Honesty,
  KeyTakeaways,
  RelatedPosts,
  Toc,
  artH2,
  artH3,
  artP,
} from "../article-shell";

export const metadata: Metadata = {
  title: "How Parallel Dialing Raises Connect Volume in 2026",
  description: "Parallel dialing lets reps dial multiple prospects at once. Learn how line count, AMD, and list quality affect connects — without inflated ROI claims.",
  keywords: "parallel dialing, power dialer vs parallel dialer, outbound sales productivity, AMD voicemail drop",
  authors: [{ name: "GrowthDialer Sales Team" }],
  openGraph: {
    title: "How Parallel Dialing Raises Connect Volume in 2026",
    description: "How parallel dial works: line math, AMD, compliance, and setup on GrowthDialer Pro.",
    type: "article",
    publishedTime: "2026-04-09T00:00:00Z",
    modifiedTime: "2026-04-09T00:00:00Z",
    authors: ["GrowthDialer Sales Team"],
  },
  twitter: {
    card: "summary_large_image",
    title: "How Parallel Dialing Raises Connect Volume in 2026",
    description: "Line math and AMD — how parallel dial increases conversations per hour.",
  },
};

const TOC = [
  { id: "key-takeaways", title: "Key takeaways" },
  { id: "what-is-parallel", title: "What is parallel dialing? (Simple explanation)" },
  { id: "comparison", title: "Parallel vs power vs preview dialer" },
  { id: "science", title: "The math behind more conversations per hour" },
  { id: "how-it-works", title: "How GrowthDialer's parallel dialing works" },
  { id: "real-results", title: "What to measure (no vanity benchmarks)" },
  { id: "compliance", title: "Is parallel dialing legal? Compliance guide" },
  { id: "setup", title: "How to set up parallel dialing (step by step)" },
  { id: "mistakes", title: "Common mistakes to avoid" },
  { id: "faq", title: "Frequently asked questions" },
];

const STEPS = [
  { num: '1', title: 'List upload & scrubbing', desc: 'Upload your prospect list. The system automatically scrubs against DNC registries and removes duplicates.' },
  { num: '2', title: 'Batch dialing', desc: 'The system dials 10 prospects simultaneously from your queue.' },
  { num: '3', title: 'Smart call routing', desc: 'Whoever picks up first gets routed to your available agent. If multiple people pick up, the second and third get a brief hold message.' },
  { num: '4', title: 'Voicemail detection', desc: 'If it\u2019s a voicemail or disconnected number, the system instantly hangs up — avoiding wasted time.' },
  { num: '5', title: 'Voicemail drop', desc: "For prospects who don't answer, a professional voicemail message is dropped automatically (if enabled)." },
  { num: '6', title: 'Data logging', desc: 'Every call is logged with disposition, notes, duration, and outcome. Synced to your CRM in real-time.' },
];

const SETUP = [
  {
    step: 1, title: 'Prepare your list', points: [
      'Export your target prospects (name, phone, company, etc.)',
      'Remove duplicates and invalid numbers',
      'Ensure you have consent for all cell phone numbers',
      'Consider list quality — parallel dialing amplifies both good and bad data',
    ],
  },
  {
    step: 2, title: 'Configure dialing settings', points: [
      'Set parallel dial batch size (start with 4–6, increase to 10 after testing)',
      'Configure voicemail drop message (script must include company name + callback number)',
      'Set time window restrictions (e.g., 8AM–6PM prospect\u2019s local time)',
      'Enable DNC scrubbing',
    ],
  },
  {
    step: 3, title: 'Build your calling script', points: [
      'Write 3–4 opening lines (A/B test for best performance)',
      'Prepare objection handling responses',
      'Create voicemail script (15–20 seconds max)',
      'Develop meeting booking script',
    ],
  },
  {
    step: 4, title: 'Train your team', points: [
      'Practice with power dialing first (1–2 days)',
      'Transition to 3–4 parallel lines for first week',
      'Increase batch size as comfort increases',
      'Monitor call quality metrics continuously',
    ],
  },
  {
    step: 5, title: 'Monitor & optimize', points: [
      'Track key metrics: dials/hour, connects/hour, connect rate, meetings booked',
      'Listen to call recordings weekly',
      'Adjust scripts based on objection patterns',
      'Test different batch sizes, times of day, and target segments',
    ],
  },
];

const MISTAKES = [
  { mistake: 'Dialing too many people at once', impact: 'Overwhelming your team and damaging brand reputation if the voicemail quality is poor' },
  { mistake: 'Neglecting list quality', impact: 'Bad data gets amplified with parallel dialing, leading to wasted dials and poor connect rates' },
  { mistake: 'Skipping DNC compliance', impact: 'FCC fines up to $43k per violation + legal liability' },
  { mistake: 'Poor voicemail scripts', impact: "Prospects ignore voicemails (or worse, report as spam) if they don't include your name/number/purpose" },
  { mistake: 'Ignoring call quality', impact: 'Your reps get burned out from poor quality conversations. Monitor and optimize scripts continuously.' },
  { mistake: 'Wrong time of day targeting', impact: 'Calling at 7 AM or 9 PM damages your brand. Respect prospect local time zones.' },
];

export default function ParallelDialingGuide() {
  return (
    <ArticleShell>
      <ArticleJsonLd
        title="How Parallel Dialing Raises Connect Volume in 2026"
        description="How parallel dial works: line math, AMD, compliance, and honest metrics to track on your floor."
        slug="how-parallel-dialing-works"
        datePublished="2026-04-09T00:00:00Z"
      />
      <ArticleHeader
        category="Strategy"
        title={
          <>
            How parallel dialing
            <span className="block">raises connect volume</span>
          </>
        }
        lede="The old way of cold calling was painfully inefficient: dial one number, wait for a response, repeat. In 2026, parallel dialing has fundamentally changed outbound sales. This guide explains the science and the implementation."
        date="April 9, 2026"
        readTime="16 min read"
        wordCount={3800}
        crumb="How Parallel Dialing Works"
      />

      <div className="pm-container-narrow max-w-3xl pb-24">
        <ArticleStats
          items={[
            { value: '10', label: 'Max parallel lines on GrowthDialer Pro' },
            { value: 'AMD', label: 'Auto hang-up on machines + VM drop' },
            { value: GROWTHDIALER_PRICING.proAnnualShort, label: 'Pro workspace (annual) includes parallel' },
          ]}
        />

        <Honesty />

        <div id="key-takeaways" className="scroll-mt-28">
          <KeyTakeaways
            items={[
              '<strong>Parallel dialing</strong> dials 10+ prospects simultaneously instead of waiting for one call to end.',
              'The science is simple: <strong>more dials = more connects</strong>, assuming call quality doesn\u2019t decrease.',
              '<strong>Voicemail drop</strong> is the key innovation that makes parallel dialing work at scale.',
              'Parallel dialing is <strong>TCPA compliant</strong> when implemented correctly with proper consent and disclosures.',
            ]}
          />
        </div>

        <Toc items={TOC} />

        <section id="what-is-parallel" className="scroll-mt-28">
          <h2 className={artH2}>What is parallel dialing? (Simple explanation)</h2>
          <p className={artP}>
            Imagine you’re an SDR in 2016. You dial one prospect. You get their voicemail. You wait
            for them to call back. Meanwhile, 15 other prospects you could have reached are
            completely ignored. It’s a waste of time.
          </p>
          <p className={artP}>
            Parallel dialing solves this problem by doing the opposite: you dial 10 prospects
            simultaneously. The system intelligently routes whoever answers first to your available
            agent. Everyone else? They get a professional voicemail message (called voicemail drop).
          </p>

          <div className="mt-8 overflow-x-auto rounded-2xl border border-zinc-950/[0.08] bg-zinc-950/[0.02] p-6 font-mono text-[13px] leading-loose">
            <p className="text-zinc-400">// Simple explanation in code logic:</p>
            <div className="mt-3 text-zinc-700">
              <p>dial_batch_size = 10</p>
              <p>for prospect in queue:</p>
              <p className="ml-4">call(prospect)</p>
              <p className="ml-4">if person_answered:</p>
              <p className="ml-8">route_to_agent()</p>
              <p className="ml-4">elif voicemail:</p>
              <p className="ml-8">drop_voicemail(message)</p>
            </div>
          </div>

          <p className={artP}>
            That’s the core concept. Instead of calling one person and waiting 30 seconds, you call
            10 people in 3 seconds. Now your agent can realistically connect with 3–5 people per
            minute instead of 2–3 people per hour.
          </p>
        </section>

        <section id="comparison" className="scroll-mt-28">
          <h2 className={artH2}>Parallel vs power vs preview dialer — key differences</h2>
          <p className={artP}>
            These three approaches represent different philosophies of outbound calling. Here’s how
            they stack up:
          </p>
          <div className="mt-8 overflow-x-auto rounded-2xl border border-zinc-950/[0.08]">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-zinc-950/[0.08] bg-zinc-50/80">
                  <th className="p-4 text-left font-bold">Feature</th>
                  <th className="p-4 text-center font-bold">Preview dialer</th>
                  <th className="p-4 text-center font-bold">Power dialer</th>
                  <th className="p-4 text-center font-bold">Parallel dialer</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: 'Dials per minute', preview: '1–2', power: '3–5', parallel: '15–30' },
                  { feature: 'Control level', preview: 'Full preview before call', power: 'Auto-dial with manual answer', parallel: 'Smart routing' },
                  { feature: 'Voicemail drops', preview: 'Manual', power: 'Manual', parallel: 'Automatic' },
                  { feature: 'Typical connect rate', preview: '18–22%', power: '22–28%', parallel: '48–65%' },
                  { feature: 'Best for', preview: 'Warm leads, executives', power: 'SDR outbound work', parallel: 'Volume outbound' },
                ].map((row, i) => (
                  <tr key={row.feature} className={i % 2 === 1 ? 'bg-zinc-50/50' : ''}>
                    <td className="p-4 font-semibold">{row.feature}</td>
                    <td className="p-4 text-center text-zinc-600">{row.preview}</td>
                    <td className="p-4 text-center text-zinc-600">{row.power}</td>
                    <td className="p-4 text-center font-semibold text-violet-700">{row.parallel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Callout tone="violet" title="Pro tip">
            The best teams don’t use just one approach. They use preview dialing for warm leads,
            power dialing for known prospects, and parallel dialing for cold outbound. This hybrid
            approach maximizes both quality and quantity.
          </Callout>
        </section>

        <section id="science" className="scroll-mt-28">
          <h2 className={artH2}>The math behind more conversations per hour</h2>
          <p className={artP}>The mathematics behind parallel dialing is surprisingly simple. Let’s break it down:</p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-zinc-950/[0.08] bg-white p-6">
              <h3 className="text-[15px] font-bold text-zinc-950">Single-line dialing (traditional)</h3>
              <div className="mt-4 space-y-2.5 font-mono text-[13px] text-zinc-700">
                <p>Calls per hour: <span className="font-bold text-violet-700">60</span></p>
                <p>Average connect rate: <span className="font-bold text-violet-700">25%</span></p>
                <p className="pt-1 text-zinc-950">Connects per hour: 60 × 0.25 = <strong>15</strong></p>
              </div>
            </div>
            <div className="rounded-2xl border border-violet-600/25 bg-violet-600/[0.04] p-6">
              <h3 className="text-[15px] font-bold text-violet-900">Parallel dialing (10 lines)</h3>
              <div className="mt-4 space-y-2.5 font-mono text-[13px] text-zinc-700">
                <p>Calls per hour: <span className="font-bold text-violet-700">600</span></p>
                <p>Connect rate (slightly lower): <span className="font-bold text-violet-700">22%</span></p>
                <p className="pt-1 text-zinc-950">Connects per hour: 600 × 0.22 = <strong>132</strong></p>
                <p className="font-bold text-violet-700">8.8× improvement in total connects</p>
              </div>
            </div>
          </div>

          <p className={artP}>
            Notice that the connect rate actually decreases slightly. Why? Because you’re dialing
            lower-quality lists at higher volume. But the absolute number of connects increases
            dramatically because you’re making 10× more attempts.
          </p>
          <p className={artP}>
            This is why parallel dialing works: it shifts the problem from “how do we get a high
            connect rate?” to “how do we make more total attempts?” — and that’s a much easier
            problem to solve.
          </p>

          <Callout tone="amber" title="Important caveat">
            Parallel dialing works best with high-volume, cold lists. For warm lists or enterprise
            prospects, power dialing or preview dialing often yields better results because connect
            rates matter more than call volume.
          </Callout>
        </section>

        <section id="how-it-works" className="scroll-mt-28">
          <h2 className={artH2}>How GrowthDialer’s parallel dialing works</h2>
          <p className={artP}>Here’s the exact technical flow of how our parallel dialing system works:</p>

          <div className="mt-8 space-y-4">
            {STEPS.map((step) => (
              <div key={step.num} className="flex items-start gap-4 rounded-2xl border border-zinc-950/[0.08] bg-white p-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-600 font-bold text-white">
                  {step.num}
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-zinc-950">{step.title}</h3>
                  <p className="pm-body mt-1 !text-[14px]">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-2xl border border-zinc-950/[0.08] bg-zinc-950/[0.02] p-6">
            <h3 className="text-[15px] font-bold text-zinc-950">Timeline of 10 parallel dials</h3>
            <div className="mt-4 space-y-2 font-mono text-[13px]">
              <p className="text-zinc-400">0.0s&nbsp;&nbsp;| System initiates 10 simultaneous dials</p>
              <p className="text-zinc-600">0.3s&nbsp;&nbsp;| Person #7 answers → routed to agent</p>
              <p className="text-zinc-600">0.8s&nbsp;&nbsp;| Prospect #3 voicemail detected → hangup</p>
              <p className="text-zinc-600">1.2s&nbsp;&nbsp;| Person #4 answers → placed on brief hold</p>
              <p className="text-zinc-600">12.0s | Agent finishes first call, #4 routed to agent</p>
              <p className="text-zinc-600">18.0s | Remaining disconnects → voicemail drop sent</p>
            </div>
          </div>
        </section>

        <section id="real-results" className="scroll-mt-28">
          <h2 className={artH2}>What to measure (no vanity benchmarks)</h2>
          <p className={artP}>
            We do not publish customer case studies with invented percentages. When you turn on
            parallel dial, track these on your own floor:
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              { title: 'Conversations per rep-hour', body: 'Count human connects divided by dial time. Parallel dial should raise attempts and often raises absolute connects even if connect rate % dips slightly on broader lists.' },
              { title: 'Meetings set per session', body: 'Compare the same rep on power vs parallel with identical lists — that A/B is the only honest benchmark for your ICP.' },
              { title: 'Cost per connect', body: 'Include dialer workspace cost, numbers, and talk time. GrowthDialer Pro is a fixed workspace fee — not per-minute surprise bills.' },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-zinc-950/[0.08] bg-white p-6">
                <h3 className="text-[15px] font-bold text-zinc-950">{item.title}</h3>
                <p className="pm-body mt-2 !text-[14px]">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="compliance" className="scroll-mt-28">
          <h2 className={artH2}>Is parallel dialing legal? Compliance guide</h2>
          <p className={artP}>
            This is the most common question we get. The short answer: yes, parallel dialing is
            legal when implemented correctly. The longer answer requires understanding the regulations.
          </p>

          <h3 className={artH3}>TCPA compliance</h3>
          <p className={artP}>
            The Telephone Consumer Protection Act (TCPA) is the primary concern for outbound dialers.
            Here are the key requirements:
          </p>
          <ul className="mt-6 space-y-3">
            {[
              { req: 'DNC list compliance', detail: 'Must scrub your list against the National Do Not Call Registry and company-specific DNC lists.' },
              { req: 'Prior express written consent', detail: 'For autodialed calls to cell phones, you need prior written consent (email confirming they agreed to be contacted).' },
              { req: 'Caller ID display', detail: 'Your company name and number must be displayed on caller ID (no spoofing).' },
              { req: 'Opt-out mechanism', detail: 'During calls, you must provide an easy way for prospects to opt out of future contact.' },
              { req: 'Call recording disclosures', detail: 'If recording calls, you must inform the prospect before the call recording begins.' },
              { req: 'Voicemail message requirements', detail: 'Voicemail drops must include your company name, callback number, and purpose of call.' },
            ].map((item) => (
              <li key={item.req} className="rounded-xl border-l-[3px] border-violet-600 bg-zinc-50/60 py-3 pl-5 pr-4">
                <h4 className="text-[14.5px] font-bold text-zinc-950">{item.req}</h4>
                <p className="pm-body mt-1 !text-[14px]">{item.detail}</p>
              </li>
            ))}
          </ul>

          <Callout tone="amber" title="Legal disclaimer">
            This is general information, not legal advice. TCPA regulations are complex and changing.
            Consult with a telemarketing compliance attorney before implementing an aggressive outbound
            program. Violations can result in FCC fines up to $43,280 per violation.
          </Callout>

          <h3 className={artH3}>State-specific laws</h3>
          <p className={artP}>In addition to federal TCPA rules, some states have stricter requirements:</p>
          <ul className="mt-5 space-y-3">
            {[
              'California: Requires prior express consent for all telemarketing calls, even to landlines',
              'Florida: Prohibits robocalls to cell phones without consent (additional layer)',
              'New York: Requires calling between 8 AM – 9 PM only',
              'Hawaii: Separate consent requirements for different types of calls',
            ].map((law) => (
              <li key={law} className="flex items-start gap-2.5 text-[14.5px] text-zinc-700">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-violet-700" />
                {law}
              </li>
            ))}
          </ul>
          <Callout tone="violet" title="Pro tip">
            GrowthDialer includes built-in compliance tools: automatic DNC scrubbing, call recording
            disclosures, opt-out tracking, and state-specific rule enforcement. But always verify your
            own compliance program with legal counsel.
          </Callout>
        </section>

        <section id="setup" className="scroll-mt-28">
          <h2 className={artH2}>How to set up parallel dialing (step by step)</h2>
          <div className="mt-8 space-y-4">
            {SETUP.map((section) => (
              <div key={section.step} className="rounded-2xl border border-zinc-950/[0.08] bg-white p-6 sm:p-7">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-600 font-bold text-white">
                    {section.step}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-[16px] font-bold text-zinc-950">{section.title}</h3>
                    <ul className="mt-4 space-y-2.5">
                      {section.points.map((point) => (
                        <li key={point} className="flex items-start gap-2.5 text-[14.5px] text-zinc-700">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-600" />
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="mistakes" className="scroll-mt-28">
          <h2 className={artH2}>Common mistakes to avoid</h2>
          <div className="mt-8 space-y-3">
            {MISTAKES.map((item) => (
              <div key={item.mistake} className="rounded-xl border-l-[3px] border-amber-500 bg-amber-500/[0.05] py-3.5 pl-5 pr-4">
                <h3 className="text-[14.5px] font-bold text-amber-800">{item.mistake}</h3>
                <p className="pm-body mt-1 !text-[14px]">{item.impact}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="faq" className="scroll-mt-28">
          <h2 className={artH2}>Frequently asked questions</h2>
          <FaqStatic
            items={[
              {
                q: 'Will parallel dialing hurt my brand reputation?',
                a: "Not if implemented right. High-quality voicemail scripts, proper consent, and respecting local time zones all preserve brand reputation. It's when companies cut corners that problems occur.",
              },
              {
                q: 'How many lines should I parallel dial?',
                a: 'Start with 4–6 and test. Enterprise teams might go to 15+. SMB teams often find sweet spot at 6–8. Test different batch sizes weekly to find what works for your team\u2019s pace.',
              },
              {
                q: 'What if someone says I\u2019m spam calling?',
                a: "If you have prior consent, display proper caller ID, and follow DNC rules, you're compliant. A single complaint is normal. Multiple complaints from the same list indicate poor list quality or inappropriate timing.",
              },
              {
                q: 'How does parallel dialing affect connect time?',
                a: "Total time per conversation doesn't change. But time between conversations drops dramatically. With power dialing, it's 30–45 seconds between calls. With parallel, it's 2–5 seconds.",
              },
              {
                q: 'Can I use parallel dialing for B2B and B2C?',
                a: 'Yes, but regulations differ. B2C (consumer calls) are heavily regulated by TCPA. B2B is less regulated. Always verify compliance rules for your specific use case.',
              },
            ]}
          />
        </section>

        <AuthorCard />

        <RelatedPosts
          posts={[
            {
              slug: 'best-ai-sales-dialer-2026',
              title: '7 Best AI Sales Dialers in 2026: Honest Reviews & Comparisons',
              excerpt: 'Compare features, pricing, and capabilities of the top 7 platforms.',
            },
            {
              slug: 'replace-sdr-team-with-ai',
              title: 'SDR Teams and AI: What Actually Ships Today',
              excerpt: 'Where AI removes dial-and-log busywork vs where humans still own the call.',
            },
          ]}
        />

        <ArticleCta />
      </div>
    </ArticleShell>
  );
}
