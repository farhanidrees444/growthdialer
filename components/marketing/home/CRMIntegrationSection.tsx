'use client';

import { motion } from 'framer-motion';
import { SiSalesforce, SiHubspot, SiPipedrive, SiNotion, SiAirtable, SiZapier } from 'react-icons/si';

const CRM_LOGOS: [typeof SiSalesforce, string][] = [
  [SiSalesforce, 'Salesforce'],
  [SiHubspot, 'HubSpot'],
  [SiPipedrive, 'Pipedrive'],
  [SiNotion, 'Notion'],
  [SiAirtable, 'Airtable'],
  [SiZapier, 'Zapier'],
];

const CRM_STEPS: StepContent[] = [
  {
    title: 'Auto-Log Calls',
    description: 'Every interaction captured with zero manual entry',
    dashboardContent: (
      <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.04] to-white/[0.02] p-8 backdrop-blur-xl">
        <div className="space-y-4">
          <div className="rounded-xl bg-white/[0.02] p-4 border border-white/[0.04]">
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-4">Just Logged</p>
            <div className="space-y-3">
              {[
                { contact: 'Jenny at TechCorp', dur: '7m 24s', status: 'Logged' },
                { contact: 'Marcus at Globex', dur: '5m 18s', status: 'Logging...' },
                { contact: 'Sarah at Acme', dur: '9m 42s', status: 'Synced' },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  className="flex items-center justify-between rounded-lg bg-white/[0.03] p-3 border border-white/[0.04]"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.2 }}
                >
                  <div>
                    <p className="text-sm font-medium text-white">{item.contact}</p>
                    <p className="text-xs text-zinc-500">{item.dur}</p>
                  </div>
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded-full ${
                      item.status === 'Logged'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : item.status === 'Logging...'
                          ? 'bg-blue-500/20 text-blue-300 animate-pulse'
                          : 'bg-cyan-500/20 text-cyan-300'
                    }`}
                  >
                    {item.status}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <span className="inline-block px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-medium">
              ✓ 247 calls auto-logged today
            </span>
          </div>
        </div>
      </div>
    ),
  },
  {
    title: 'Smart Sync',
    description: 'Call data flows seamlessly to your CRM',
    dashboardContent: (
      <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.04] to-white/[0.02] p-8 backdrop-blur-xl">
        <div className="space-y-4">
          <div className="rounded-xl bg-white/[0.02] p-4 border border-white/[0.04]">
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-4">Sync Status</p>
            <div className="space-y-3">
              {[
                { system: 'Salesforce', status: 'Connected', updated: '2m ago' },
                { system: 'Google Workspace', status: 'Connected', updated: '1m ago' },
                { system: 'Slack', status: 'Connected', updated: '5m ago' },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg bg-white/[0.03] p-3 border border-white/[0.04]">
                  <div className="flex items-center gap-3">
                    <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    <div>
                      <p className="text-sm font-medium text-white">{item.system}</p>
                      <p className="text-xs text-zinc-500">{item.updated}</p>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-emerald-400">{item.status}</span>
                </div>
              ))}
            </div>
          </div>
          <motion.div
            className="rounded-lg bg-gradient-to-r from-violet-500/10 to-cyan-500/10 p-4 border border-white/[0.04]"
            animate={{ borderColor: ['rgba(255,255,255,0.04)', 'rgba(139,92,246,0.2)', 'rgba(255,255,255,0.04)'] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <p className="text-sm text-white">
              📊 Today: <span className="font-bold text-cyan-400">1,847</span> records synced to CRM
            </p>
          </motion.div>
        </div>
      </div>
    ),
  },
  {
    title: 'Custom Workflows',
    description: 'Trigger actions automatically based on call outcomes',
    dashboardContent: (
      <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.04] to-white/[0.02] p-8 backdrop-blur-xl">
        <div className="space-y-4">
          <p className="text-xs text-zinc-500 uppercase tracking-wider">Active Automations</p>
          <div className="space-y-3">
            {[
              { name: 'High-Intent Leads → VIP List', triggered: 23, color: 'emerald' },
              { name: 'No Connect → Retry Tomorrow', triggered: 156, color: 'blue' },
              { name: 'Decision Maker → Calendar Invite', triggered: 8, color: 'violet' },
            ].map((workflow, i) => (
              <motion.div
                key={i}
                className={`rounded-lg bg-${workflow.color}-500/10 p-3 border border-${workflow.color}-500/20`}
                animate={{ scale: [1, 1.01, 1] }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white">{workflow.name}</span>
                  <span className={`text-xs font-bold text-${workflow.color}-400`}>
                    {workflow.triggered}x
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
          <button className="w-full mt-2 px-4 py-2 rounded-lg bg-violet-500/20 text-violet-300 text-sm font-medium hover:bg-violet-500/30 transition-colors">
            Create New Automation
          </button>
        </div>
      </div>
    ),
  },
];

export function CRMIntegrationSection() {
  return (
    <AnimatedSection
      title="Seamless CRM Integration"
      subtitle="Connect your entire tech stack in minutes"
      logos={CRM_LOGOS}
      steps={CRM_STEPS}
      stepDurationMs={4500}
      className="bg-gradient-to-b from-black to-zinc-950"
    />
  );
}
