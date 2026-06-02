'use client';

import { motion } from 'framer-motion';
import { SiOpenai, SiMicrosoft, SiGoogle, SiPython, SiTwilio, SiZapier } from 'react-icons/si';

const AI_LOGOS: [typeof SiOpenai, string][] = [
  [SiOpenai, 'OpenAI'],
  [SiMicrosoft, 'Azure'],
  [SiGoogle, 'Google AI'],
  [SiPython, 'Python'],
  [SiTwilio, 'Twilio'],
  [SiZapier, 'Zapier'],
];

const AI_STEPS: StepContent[] = [
  {
    title: 'Detect Intent',
    description: 'AI analyzes prospect tone and objections in real-time',
    dashboardContent: (
      <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.04] to-white/[0.02] p-8 backdrop-blur-xl">
        <div className="grid gap-6">
          <div className="flex items-center justify-between rounded-xl bg-white/[0.02] p-4 border border-white/[0.04]">
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-wider">Current Call</p>
              <p className="text-lg font-semibold text-white">Jenny from TechCorp</p>
              <p className="text-sm text-cyan-400">Interested, ready for demo</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-500 to-cyan-400 animate-pulse" />
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3 rounded-lg bg-white/[0.03] p-3 border border-white/[0.04]">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm text-zinc-300">Intent: Positive → Prospect wants pricing</span>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-white/[0.03] p-3 border border-white/[0.04]">
              <span className="inline-block h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-sm text-zinc-300">Sentiment: Confident, engaged tone detected</span>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    title: 'Generate Summary',
    description: 'AI creates accurate call notes and next steps',
    dashboardContent: (
      <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.04] to-white/[0.02] p-8 backdrop-blur-xl">
        <div className="grid gap-6">
          <div className="rounded-xl bg-white/[0.02] p-4 border border-white/[0.04]">
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">AI Generated Summary</p>
            <p className="text-white text-sm leading-relaxed">
              Jenny demonstrated high interest in our enterprise plan. Key pain point: current CRM lacks mobile access. She requested a demo of mobile features. Next step: Schedule demo call.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-gradient-to-br from-violet-500/10 to-transparent p-3 border border-violet-500/20">
              <p className="text-xs text-violet-400 font-medium">Priority</p>
              <p className="text-lg font-semibold text-white">High</p>
            </div>
            <div className="rounded-lg bg-gradient-to-br from-cyan-500/10 to-transparent p-3 border border-cyan-500/20">
              <p className="text-xs text-cyan-400 font-medium">Follow-up</p>
              <p className="text-lg font-semibold text-white">24h</p>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    title: 'Log to CRM',
    description: 'Results sync automatically to your sales system',
    dashboardContent: (
      <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.04] to-white/[0.02] p-8 backdrop-blur-xl">
        <div className="grid gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3 rounded-lg bg-white/[0.03] p-3 border border-white/[0.04]">
              <span className="inline-block h-8 w-8 rounded bg-blue-500/20 flex items-center justify-center">
                <span className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
              </span>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">Synced to Salesforce</p>
                <p className="text-xs text-zinc-500">Contact, call log, next action</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-white/[0.03] p-3 border border-white/[0.04]">
              <span className="inline-block h-8 w-8 rounded bg-emerald-500/20 flex items-center justify-center">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              </span>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">Task Created</p>
                <p className="text-xs text-zinc-500">Demo scheduled, assignee notified</p>
              </div>
            </div>
          </div>
          <div className="text-center pt-4">
            <span className="inline-block px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-medium">
              ✓ All systems updated
            </span>
          </div>
        </div>
      </div>
    ),
  },
];

export function AIIntelligenceSection() {
  return (
    <AnimatedSection
      title="AI-Powered Call Intelligence"
      subtitle="Real-time insights that turn calls into pipeline growth"
      logos={AI_LOGOS}
      steps={AI_STEPS}
      stepDurationMs={4500}
      className="bg-gradient-to-b from-zinc-950 to-black"
    />
  );
}
