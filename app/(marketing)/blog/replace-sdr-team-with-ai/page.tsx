import { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { GROWTHDIALER_PRICING, ROADMAP_NOT_LIVE, SHIPPED_TODAY } from "@/lib/marketing/honest-copy";
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
  title: "SDR Teams and AI: What Actually Ships Today (2026 Guide)",
  description: "Where AI removes dial-and-log busywork vs where humans still own discovery and closing. Honest cost math using GrowthDialer Pro — no autonomous agent hype.",
  keywords: "AI SDR, sales dialer AI, conversation intelligence, outbound automation, AI call summaries",
  authors: [{ name: "GrowthDialer Sales Team" }],
  openGraph: {
    title: "SDR Teams and AI: What Actually Ships Today",
    description: "Post-call AI, parallel dial, and coaching — what GrowthDialer ships vs what's still roadmap.",
    type: "article",
    publishedTime: "2026-04-09T00:00:00Z",
    modifiedTime: "2026-04-09T00:00:00Z",
    authors: ["GrowthDialer Sales Team"],
  },
  twitter: {
    card: "summary_large_image",
    title: "SDR Teams and AI: What Actually Ships Today",
    description: "Honest guide to AI-assisted outbound — not replacing your team with fictional voice bots.",
  },
};

const TOC = [
  { id: "key-takeaways", title: "Key takeaways" },
  { id: "why-broken", title: "Why the traditional SDR model is failing in 2026" },
  { id: "what-ai-can", title: "What AI sales agents can (and cannot) do" },
  { id: "cost-comparison", title: "The real cost comparison: human SDR vs AI agent" },
  { id: "transition-plan", title: "Step-by-step: how to transition to AI SDRs" },
  { id: "case-studies", title: "What we will (and won't) claim" },
  { id: "how-growthdialer", title: "How GrowthDialer helps SDRs today" },
  { id: "human-sdrs", title: "What happens to your human SDRs?" },
  { id: "objections", title: "Common objections (answered honestly)" },
  { id: "faq", title: "Frequently asked questions" },
];

const COST_ROWS = [
  { item: 'Base salary', cost: '$45,000', note: 'Typical range $40–55K' },
  { item: 'Payroll taxes (15%)', cost: '$6,750', note: 'FICA, state, local' },
  { item: 'Benefits (health, dental, 401k)', cost: '$8,000', note: 'Conservative estimate' },
  { item: 'Dialer software', cost: '$2,400', note: 'PhoneBurner, Aircall, etc.' },
  { item: 'CRM software', cost: '$1,200', note: 'Seat license for Salesforce/HubSpot' },
  { item: 'Productivity tools (Slack, etc)', cost: '$800', note: 'Collaboration software' },
  { item: 'Office space amortized', cost: '$3,000', note: 'Desk space at $300/month' },
  { item: 'Onboarding & training', cost: '$2,000', note: 'First 3 months ramp, management time' },
  { item: 'Turnover replacement costs', cost: '$4,800', note: '10–15% turnover × recruiting' },
  { item: 'Manager oversight (30%)', cost: '$15,000', note: '1-hour weekly coaching per rep' },
];

const CAPABILITY_ROWS = [
  { task: 'Cold calling', cap: '✓ Excellent', quality: '95%', note: 'Handles objections, books meetings' },
  { task: 'Voicemail drops', cap: '✓ Excellent', quality: '98%', note: 'Professional, consistent delivery' },
  { task: 'Initial qualification', cap: '✓ Good', quality: '78%', note: 'Gets the basics, misses nuance' },
  { task: 'Company research', cap: '✓ Good', quality: '82%', note: 'Relies on real-time data accuracy' },
  { task: 'Relationship building', cap: '◐ Limited', quality: '45%', note: 'Can sound robotic, lacks personalization' },
  { task: 'Complex negotiations', cap: '✗ Poor', quality: '12%', note: 'Escalate to human for any negotiation' },
  { task: 'Handling hostile prospects', cap: '◐ Limited', quality: '35%', note: 'Often escalates to human' },
  { task: 'Industry expertise (technical)', cap: '◐ Limited', quality: '55%', note: 'Works well with technical documentation' },
];

const TRANSITION = [
  {
    step: 1, title: 'Audit your current process (Week 1–2)', output: 'Process documentation + baseline metrics spreadsheet', points: [
      'Document your entire SDR workflow: lead sources, scripts, qualification criteria, CRM process',
      'Measure baselines: dials/day, connect rate, qualification rate, meeting booking rate',
      'Identify which 60–80% of work can be automated',
      'Map your CRM data quality (AI depends on clean data)',
      'Review compliance: TCPA, GDPR, state laws that apply to your outreach',
    ],
  },
  {
    step: 2, title: 'Start small (pilot, Week 3–6)', output: 'Real performance data comparing AI vs human on same list', points: [
      "Don't replace all 5 SDRs at once. Start with 1 AI agent on your warmest, most structured lead list",
      'Give AI agent the easiest segment: 50–100 leads that match your ideal customer profile',
      'Run parallel with your best SDR (let AI and human work same list) for 2 weeks to compare',
      'Monitor quality: call recordings, conversation outcomes, meeting quality',
      'Adjust scripts and settings based on real performance',
    ],
  },
  {
    step: 3, title: 'Expand scope (Week 7–12)', output: 'Proof that AI-booked meetings convert at acceptable rates', points: [
      'Move AI to larger, colder list (500–2000 leads)',
      'Add complexity: different industries, different buying stages',
      'Deploy a second AI agent if first is working well',
      'Train your sales team on how to use warm leads passed by AI',
      'Monitor: meeting-to-close conversion rate (most important metric)',
    ],
  },
  {
    step: 4, title: 'Full rollout & transition (Week 13–24)', output: 'New sales org chart, new SDR/AE responsibilities, new workflow', points: [
      'Move to full automation: all SDR-level outreach goes through AI first',
      'Identify which human SDRs will be transitioned to AE roles (your top performers)',
      'Create clear communication plan for impacted team members',
      "Document what happens to the 'handoff' — who qualifies leads for the sales team?",
      'Set up performance tracking: monitor monthly quality and efficiency metrics',
    ],
  },
  {
    step: 5, title: 'Ongoing optimization (Month 7+)', output: 'Monthly dashboard showing AI agent ROI vs SDR costs', points: [
      'Monthly reviews of AI performance vs targets',
      'A/B testing of scripts, voicemail messages, qualification criteria',
      'Integration with your sales coaching program',
      'Regular compliance audits (especially important for TCPA)',
      'Quarterly board reporting on ROI and savings',
    ],
  },
];

const OBJECTIONS = [
  {
    obj: 'AI will damage our brand reputation with robocalls',
    answer: 'Valid concern if executed poorly. But GrowthDialer handles this three ways: (1) compliance-first approach with proper disclosures, (2) human-quality voicemail scripts with your company personality, (3) monitor every call for quality and immediately adjust. The companies hurting their brand are the ones NOT using intelligent automation — they\u2019re getting flagged as spam because of bad call patterns.',
  },
  {
    obj: 'Our prospects will know they\u2019re talking to AI',
    answer: 'Prospects care that you sound professional and offer real value — whether notes are AI-generated or hand-typed. GrowthDialer keeps humans on the call; AI handles summaries and prep afterward. Autonomous voice agents are a separate category we have not shipped.',
  },
  {
    obj: 'AI won\u2019t understand our complex sales process',
    answer: 'You\u2019re right. That\u2019s why implementation takes 4–8 weeks, not 4–8 days. The transition plan builds in extensive configuration: define your qualification criteria, create multiple objection scripts, test against real prospect lists. AI learns your rules and follows them perfectly. No SDR does that.',
  },
  {
    obj: 'We\u2019ll lose competitive advantage if we replace SDRs',
    answer: 'The opposite is true. Your competitors are getting faster at sales development. If you\u2019re still using pure human SDRs in 2026, you\u2019re 40–60% slower than competition using AI. You lose advantage by staying behind, not by moving forward.',
  },
  {
    obj: 'What if the AI makes mistakes or says something wrong?',
    answer: 'It will. And you monitor for it. That\u2019s the QA process. But think about this: your new SDR makes mistakes on 10% of calls too. AI makes mistakes more systematically, which actually makes them easier to identify and fix. One script adjustment fixes 1000 calls instead of hoping you coach the right behavior into one human over weeks.',
  },
  {
    obj: 'Our sales process is too unique for AI to handle',
    answer: 'Probably not. 95% of B2B sales follow the same basic pattern: identify prospect, make initial contact, qualify, book meeting. The 5% that\u2019s unique is the stuff humans should do anyway. AI handles the 95%, humans focus on the 5% where your real differentiation is.',
  },
];

export default function ReplaceSDRTeamWithAI() {
  return (
    <ArticleShell>
      <ArticleJsonLd
        title="SDR Teams and AI: What Actually Ships Today (2026 Guide)"
        description="Where AI removes dial-and-log busywork vs where humans still own discovery and closing. Honest cost math using GrowthDialer Pro — no autonomous agent hype."
        slug="replace-sdr-team-with-ai"
        datePublished="2026-04-09T00:00:00Z"
      />
      <ArticleHeader
        category="Guide"
        title={
          <>
            SDR teams and AI in 2026:
            <span className="block">what actually ships</span>
          </>
        }
        lede="AI in outbound today means recording, transcription, summaries, and coaching — not a voice bot that replaces your SDRs. This guide separates what GrowthDialer ships from roadmap hype, and shows honest cost math for a human SDR vs an AI-assisted dialer stack."
        date="April 9, 2026"
        readTime="19 min read"
        wordCount={4500}
        crumb="SDR Teams and AI"
      />

      <div className="pm-container-narrow max-w-3xl pb-24">
        <Honesty />

        <ArticleStats
          items={[
            { value: GROWTHDIALER_PRICING.proAnnualShort, label: 'Pro workspace (annual) — AI summaries included' },
            { value: 'Free', label: 'Starter tier to validate before you scale seats' },
            { value: 'HubSpot', label: 'Live CRM integration today (others on roadmap)' },
          ]}
        />

        <div id="key-takeaways" className="scroll-mt-28">
          <KeyTakeaways
            items={[
              '<strong>Humans still close.</strong> AI today removes notes, logging, and prep — not discovery calls.',
              '<strong>Autonomous voice agents</strong> are on GrowthDialer\u2019s roadmap — not in production.',
              '<strong>Compare tools honestly:</strong> dialer + AI summaries vs fully loaded SDR cost — not fictional $200/mo bots.',
              '<strong>Start on Starter free</strong> — measure time saved on your actual call volume before upgrading.',
            ]}
          />
        </div>

        <Toc items={TOC} />

        <section id="why-broken" className="scroll-mt-28">
          <h2 className={artH2}>Why the traditional SDR model is failing in 2026</h2>
          <p className={artP}>
            The modern SDR job description hasn’t meaningfully changed since 2010. Make calls, send
            emails, qualify leads, book meetings. Repeat. But the economics have changed dramatically.
          </p>

          <h3 className={artH3}>The SDR cost breakdown</h3>
          <div className="mt-8 overflow-x-auto rounded-2xl border border-zinc-950/[0.08]">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-zinc-950/[0.08] bg-zinc-50/80">
                  <th className="p-4 text-left font-bold">Expense</th>
                  <th className="p-4 text-right font-bold">Annual cost</th>
                  <th className="p-4 text-right font-bold">Notes</th>
                </tr>
              </thead>
              <tbody>
                {COST_ROWS.map((row, i) => (
                  <tr key={row.item} className={i % 2 === 1 ? 'bg-zinc-50/50' : ''}>
                    <td className="p-4">{row.item}</td>
                    <td className="p-4 text-right font-semibold">{row.cost}</td>
                    <td className="p-4 text-right text-[12px] text-zinc-500">{row.note}</td>
                  </tr>
                ))}
                <tr className="border-t-2 border-violet-600/40 bg-violet-600/[0.04]">
                  <td className="p-4 font-bold">Total annual cost</td>
                  <td className="p-4 text-right font-bold text-violet-700">$88,950</td>
                  <td className="p-4" />
                </tr>
              </tbody>
            </table>
          </div>

          <p className={artP}>
            So one fully-loaded SDR costs you ~$89K per year. Productivity metrics: most reach 50–70
            people per day, with 4–6 month ramp time. After ramp, they book 6–12 qualified meetings
            per month.
          </p>

          <h3 className={artH3}>Dialer software vs loaded SDR cost</h3>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-zinc-950/[0.08] bg-white p-7">
              <h4 className="text-[15px] font-bold text-zinc-950">Traditional SDR (loaded, illustrative)</h4>
              <p className="mt-3 font-display text-[2rem] font-bold tracking-tight">~$89K/yr</p>
              <ul className="mt-4 space-y-2 text-[14px] text-zinc-600">
                <li>• Salary, benefits, manager time</li>
                <li>• Ramp and turnover</li>
                <li>• Humans still required to sell</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-violet-600/25 bg-violet-600/[0.04] p-7">
              <h4 className="text-[15px] font-bold text-violet-900">GrowthDialer Pro (annual)</h4>
              <p className="mt-3 font-display text-[2rem] font-bold tracking-tight text-violet-700">
                {GROWTHDIALER_PRICING.proAnnualTotal}
              </p>
              <ul className="mt-4 space-y-2 text-[14px] text-zinc-700">
                <li>• Up to 3 seats per workspace</li>
                <li>• AI summaries on recorded calls</li>
                <li>• Not an autonomous voice agent</li>
              </ul>
            </div>
          </div>

          <Callout tone="amber" title="The honest truth">
            Software cost is tiny next to people cost. GrowthDialer saves rep time on notes and
            logging — it does not replace headcount by itself.
          </Callout>
        </section>

        <section id="what-ai-can" className="scroll-mt-28">
          <h2 className={artH2}>What AI sales agents can (and cannot) do</h2>
          <p className={artP}>
            The key to successful AI SDR replacement is being completely honest about what AI can and
            cannot do. Here’s the breakdown:
          </p>
          <div className="mt-8 overflow-x-auto rounded-2xl border border-zinc-950/[0.08]">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-zinc-950/[0.08] bg-zinc-50/80">
                  <th className="p-4 text-left font-bold">Task</th>
                  <th className="p-4 text-center font-bold">AI capability</th>
                  <th className="p-4 text-center font-bold">Quality level</th>
                  <th className="p-4 text-left font-bold">Notes</th>
                </tr>
              </thead>
              <tbody>
                {CAPABILITY_ROWS.map((row, i) => (
                  <tr key={row.task} className={i % 2 === 1 ? 'bg-zinc-50/50' : ''}>
                    <td className="p-4 font-medium">{row.task}</td>
                    <td className="p-4 text-center font-semibold">{row.cap}</td>
                    <td className="p-4 text-center text-zinc-600">{row.quality}</td>
                    <td className="p-4 text-[12.5px] text-zinc-500">{row.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Callout tone="violet" title="The 80/20 rule">
            AI excels at the 80% of work that’s repetitive, high-volume, and rule-based: making calls,
            handling standard objections, booking meetings. It struggles with the 20% that requires
            contextual thinking and relationship skills. Focus AI on the 80%, keep humans for the 20%.
          </Callout>
        </section>

        <section id="cost-comparison" className="scroll-mt-28">
          <h2 className={artH2}>The real cost comparison: human SDR vs AI agent</h2>
          <p className={artP}>
            Let’s do a detailed analysis over 3 years, the typical tenure before an SDR either burns
            out or gets promoted:
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-zinc-950/[0.08] bg-white p-7">
              <h3 className="text-[16px] font-bold text-zinc-950">Hiring 1 SDR for 3 years</h3>
              <div className="mt-5 space-y-4 text-[14px] text-zinc-700">
                <div>
                  <p className="text-[12.5px] text-zinc-500">Year 1 (ramp)</p>
                  <p className="font-bold">$89K × 1.2 (lower productivity) = <span className="text-amber-700">$106,800</span></p>
                </div>
                <div>
                  <p className="text-[12.5px] text-zinc-500">Year 2 (productive)</p>
                  <p className="font-bold">$89K × 1.0 = <span className="text-amber-700">$89,000</span></p>
                </div>
                <div>
                  <p className="text-[12.5px] text-zinc-500">Year 3 (trending up)</p>
                  <p className="font-bold">$89K × 1.1 (raise + benefits increase) = <span className="text-amber-700">$97,900</span></p>
                </div>
                <div className="border-t border-zinc-950/[0.08] pt-4">
                  <p className="text-[12.5px] text-zinc-500">3-year total</p>
                  <p className="font-display text-[1.6rem] font-bold tracking-tight text-zinc-950">$293,700</p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-violet-600/25 bg-violet-600/[0.04] p-7">
              <h3 className="text-[16px] font-bold text-violet-900">GrowthDialer Pro for 3 years (3-seat workspace)</h3>
              <div className="mt-5 space-y-4 text-[14px] text-zinc-700">
                <div>
                  <p className="text-[12.5px] text-zinc-500">Year 1–3 (annual billing)</p>
                  <p className="font-bold">{GROWTHDIALER_PRICING.proAnnualTotal} × 3 = <span className="text-violet-700">$1,404</span></p>
                </div>
                <p className="text-[12.5px] text-zinc-500">
                  Includes parallel dial, AI summaries, coaching floor, HubSpot sync — not an autonomous voice agent.
                </p>
                <div className="border-t border-violet-600/20 pt-4">
                  <p className="text-[12.5px] text-zinc-500">3-year software total</p>
                  <p className="font-display text-[1.6rem] font-bold tracking-tight text-violet-700">~$1,400</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-violet-600/25 bg-gradient-to-br from-violet-600/[0.07] to-transparent p-8 text-center">
            <p className="text-[13px] text-zinc-600">Illustrative savings vs one loaded SDR</p>
            <p className="mt-2 font-display text-[1.5rem] font-bold tracking-tight text-violet-700">
              Software is the small line item
            </p>
            <p className="pm-body mx-auto mt-2 max-w-lg !text-[14px]">
              GrowthDialer augments reps — it does not replace salary, benefits, or manager time.
              Budget honestly.
            </p>
          </div>

          <h3 className={artH3}>But there are hidden costs to consider</h3>
          <div className="mt-6 space-y-3">
            {[
              { cost: 'Integration & setup', amount: '$2,000–5,000', detail: 'CRM integration, API setup, compliance configuration' },
              { cost: 'Quality assurance & monitoring', amount: '$3,000–6,000/year', detail: 'Listening to calls, adjusting scripts, optimizing performance' },
              { cost: 'List management', amount: '$1,500–3,000/year', detail: 'Data scrubbing, DNC compliance, list acquisition' },
              { cost: 'Sales enablement changes', amount: '$5,000–10,000', detail: 'New processes, training, documentation for your team' },
            ].map((item) => (
              <div key={item.cost} className="flex items-start justify-between gap-4 rounded-2xl border border-zinc-950/[0.08] bg-white p-5">
                <div>
                  <h4 className="text-[14.5px] font-bold text-zinc-950">{item.cost}</h4>
                  <p className="pm-small mt-1">{item.detail}</p>
                </div>
                <span className="shrink-0 font-bold text-violet-700">{item.amount}</span>
              </div>
            ))}
          </div>

          <p className={artP}>
            Even with GrowthDialer on Pro, you still pay people to sell. The win is fewer hours on
            notes, logging, and list babysitting — measure that on your floor, not with a fabricated
            ROI slide.
          </p>
        </section>

        <section id="transition-plan" className="scroll-mt-28">
          <h2 className={artH2}>Step-by-step: how to transition to AI SDRs</h2>
          <p className={artP}>
            This is the critical part. Rushing the transition leads to failure. Here’s the proper approach:
          </p>
          <div className="mt-8 space-y-4">
            {TRANSITION.map((section) => (
              <div key={section.step} className="rounded-2xl border border-zinc-950/[0.08] bg-white p-7">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-violet-600 text-lg font-bold text-white">
                    {section.step}
                  </div>
                  <h3 className="pt-2 text-[1.15rem] font-bold tracking-tight text-zinc-950">{section.title}</h3>
                </div>
                <ul className="mt-6 space-y-3">
                  {section.points.map((point) => (
                    <li key={point} className="flex items-start gap-2.5 text-[14.5px] text-zinc-700">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-violet-700" />
                      {point}
                    </li>
                  ))}
                </ul>
                <p className="mt-5 rounded-xl bg-violet-600/[0.05] px-4 py-3 text-[13px] font-medium text-violet-800">
                  Output: {section.output}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section id="case-studies" className="scroll-mt-28">
          <h2 className={artH2}>What we will (and won’t) claim</h2>
          <p className={artP}>
            We do not publish named customer case studies with percentage lifts until customers
            approve them. Until then:
          </p>
          <ul className="mt-6 space-y-3">
            {[
              'We will not cite “2,400+ teams” or star ratings without a verified source.',
              'We will not promise autonomous AI agents — they are on the roadmap.',
              'We will publish your story when you opt in — with real numbers you provide.',
            ].map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-[14.5px] text-zinc-700">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-violet-700" />
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section id="how-growthdialer" className="scroll-mt-28">
          <h2 className={artH2}>How GrowthDialer helps SDRs today</h2>
          <p className={artP}>
            GrowthDialer is a revenue dialer for humans — not a replacement SDR bot. Here is what
            ships in production:
          </p>
          <div className="mt-6 space-y-2.5">
            {SHIPPED_TODAY.map((item) => (
              <div key={item} className="rounded-xl border-l-[3px] border-violet-600 bg-zinc-50/60 py-3 pl-5 pr-4">
                <p className="text-[14.5px] text-zinc-700">{item}</p>
              </div>
            ))}
          </div>
          <p className="pm-small mt-6">On the roadmap (not live): {ROADMAP_NOT_LIVE.join(' · ')}</p>
          <Link href="/compare/vs-orum" className="pm-btn pm-btn-secondary mt-6">
            See how GrowthDialer compares <ArrowRight className="h-4 w-4" />
          </Link>
        </section>

        <section id="human-sdrs" className="scroll-mt-28">
          <h2 className={artH2}>What happens to your human SDRs?</h2>
          <p className={artP}>
            GrowthDialer does not eliminate SDR jobs. It removes busywork after and between calls —
            logging, summaries, prep — so the same headcount can run more quality conversations.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-zinc-950/[0.08] bg-white p-6">
              <h3 className="text-[15px] font-bold text-violet-700">Software handles</h3>
              <ul className="mt-4 space-y-2.5 text-[14px] text-zinc-700">
                {[
                  'Call recording and transcription',
                  'AI summaries, sentiment, and next steps',
                  'Power / parallel dialing with AMD',
                  'Dispositions and pipeline logging',
                  'Manager coaching / whisper on live calls',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-0.5 font-bold text-violet-700">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-violet-600/25 bg-violet-600/[0.04] p-6">
              <h3 className="text-[15px] font-bold text-violet-800">Humans still own</h3>
              <ul className="mt-4 space-y-2.5 text-[14px] text-zinc-700">
                {[
                  'Discovery and qualification conversations',
                  'Executive outreach and account strategy',
                  'Complex objection handling',
                  'Closing and negotiation',
                  'Account expansion and relationship work',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-0.5 font-bold text-violet-700">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <h3 className={artH3}>Realistic scenarios</h3>
          <div className="mt-6 space-y-3">
            {[
              { performer: 'Top SDR performer', transition: 'Promoted to account executive or strategic SDR', benefit: 'Higher pay, more autonomy, focus on high-value accounts' },
              { performer: 'Average SDR', transition: 'Transition to AI optimization specialist or inside sales', benefit: 'Different career path, lower stress, focus on conversion' },
              { performer: 'Struggling SDR', transition: 'Natural attrition or internal transition to customer success', benefit: 'Better fit for their skills, less pressure-driven environment' },
            ].map((s) => (
              <div key={s.performer} className="rounded-xl border-l-[3px] border-violet-600 bg-zinc-50/60 py-3.5 pl-5 pr-4">
                <h4 className="text-[14.5px] font-bold text-zinc-950">{s.performer}</h4>
                <p className="mt-1 text-[14px] text-zinc-700"><strong>Transition:</strong> {s.transition}</p>
                <p className="pm-small mt-0.5">{s.benefit}</p>
              </div>
            ))}
          </div>

          <Callout tone="violet" title="Pro tip">
            The key to smooth transition: communicate early and honestly. Tell your team
            “We’re deploying AI to handle 80% of the grunt work so you can focus on what you’re
            actually good at — building relationships and closing deals.” Good SDRs see this as a
            promotion, not a threat.
          </Callout>
        </section>

        <section id="objections" className="scroll-mt-28">
          <h2 className={artH2}>Common objections (answered honestly)</h2>
          <div className="mt-8 space-y-3">
            {OBJECTIONS.map((item) => (
              <div key={item.obj} className="rounded-2xl border border-zinc-950/[0.08] bg-white p-6">
                <h3 className="text-[15.5px] font-bold text-zinc-950">{item.obj}</h3>
                <p className="pm-body mt-2.5 !text-[14.5px]">{item.answer}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="faq" className="scroll-mt-28">
          <h2 className={artH2}>Frequently asked questions</h2>
          <FaqStatic
            items={[
              {
                q: 'How long before AI ROI becomes positive?',
                a: 'Typically 30–60 days. After that, dialer + AI summary cost per qualified lead is a fraction of a human SDR\u2019s. The payback period is fast because the cost difference is so dramatic.',
              },
              {
                q: 'What if AI doesn\u2019t work well for our market/industry?',
                a: 'The 7-day free trial is exactly for this. Try it with a real list. If your qualification process is unusual or your buyers specifically dislike AI summaries, you\u2019ll find out in week one.',
              },
              {
                q: 'Do we need a dedicated person to manage the AI?',
                a: 'Not full-time. Most teams designate one person (usually in sales ops) to spend 2–3 hours/week on QA, script optimization, and reporting. Consider this fractional cost when budgeting.',
              },
              {
                q: 'Can we run human SDRs and AI agents in parallel?',
                a: 'Yes, and this is recommended during transition. Run them on the same list for 2 weeks to compare quality and performance. Data proves which approach is better for your specific market.',
              },
              {
                q: 'What about compliance and data privacy?',
                a: 'GrowthDialer includes TCPA compliance tools, GDPR data handling, and state-specific restrictions. But verify with your legal team — we provide the tools, you own compliance responsibility.',
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
              excerpt: 'Find the right platform for your specific needs.',
            },
            {
              slug: 'how-parallel-dialing-works',
              title: 'How Parallel Dialing Raises Connect Volume in 2026',
              excerpt: 'Understand the technology behind high-volume outbound.',
            },
          ]}
        />

        <ArticleCta />
      </div>
    </ArticleShell>
  );
}
