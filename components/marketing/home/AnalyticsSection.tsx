'use client';

import { motion } from 'framer-motion';
import { SiTableau, SiPowerbi, SiGoogleanalytics, SiDatadog, SiGrafana, SiSplunk } from 'react-icons/si';
import { AnimatedSection, type StepContent } from './AnimatedSection';

const ANALYTICS_LOGOS: [typeof SiTableau, string][] = [
  [SiTableau, 'Tableau'],
  [SiPowerbi, 'Power BI'],
  [SiGoogleanalytics, 'Analytics'],
  [SiDatadog, 'Datadog'],
  [SiGrafana, 'Grafana'],
  [SiSplunk, 'Splunk'],
];

const ANALYTICS_STEPS: StepContent[] = [
  {
    title: 'Real-Time Dashboard',
    description: 'Live metrics on every call, campaign, and agent',
    dashboardContent: (
      <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.04] to-white/[0.02] p-8 backdrop-blur-xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Calls', value: '1,247', color: 'violet' },
            { label: 'Connect Rate', value: '68%', color: 'emerald' },
            { label: 'Avg Duration', value: '6m 42s', color: 'cyan' },
            { label: 'Pipeline Value', value: '$847K', color: 'amber' },
          ].map((stat, i) => (
            <motion.div
              key={i}
              className={`rounded-lg bg-${stat.color}-500/10 p-4 border border-${stat.color}-500/20 text-center`}
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 3, repeat: Infinity, delay: i * 0.3 }}
            >
              <p className={`text-2xl font-bold text-${stat.color}-400`}>{stat.value}</p>
              <p className="text-xs text-zinc-400 mt-2">{stat.label}</p>
            </motion.div>
          ))}
        </div>
        <div className="space-y-3">
          <p className="text-xs text-zinc-500 uppercase tracking-wider">Top Performers This Week</p>
          <div className="space-y-2">
            {['Marcus O.', 'Sarah J.', 'David L.'].map((name, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg bg-white/[0.03] p-3 border border-white/[0.04]">
                <span className="text-sm text-white">{name}</span>
                <motion.div
                  className="h-1.5 w-20 rounded-full bg-white/10 overflow-hidden"
                  animate={{ opacity: [0.5, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <motion.div
                    className="h-full bg-gradient-to-r from-violet-500 to-cyan-400"
                    animate={{ width: ['0%', [80, 85, 75][i] + '%'] }}
                    transition={{ duration: 2 }}
                  />
                </motion.div>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
  },
  {
    title: 'Predictive Analytics',
    description: 'ML models forecast outcomes and identify opportunities',
    dashboardContent: (
      <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.04] to-white/[0.02] p-8 backdrop-blur-xl">
        <div className="space-y-4">
          <div className="rounded-xl bg-white/[0.02] p-4 border border-white/[0.04]">
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-4">AI Predictions</p>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-white">Likely to Close (30d)</span>
                  <span className="text-xs text-emerald-400 font-medium">87%</span>
                </div>
                <motion.div className="h-2 rounded-full bg-white/10 overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400"
                    animate={{ width: ['0%', '87%'] }}
                    transition={{ duration: 2, ease: 'easeOut' }}
                  />
                </motion.div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-white">Churn Risk</span>
                  <span className="text-xs text-amber-400 font-medium">23%</span>
                </div>
                <motion.div className="h-2 rounded-full bg-white/10 overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-amber-500 to-orange-400"
                    animate={{ width: ['0%', '23%'] }}
                    transition={{ duration: 2, ease: 'easeOut', delay: 0.2 }}
                  />
                </motion.div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-white">Upsell Opportunity</span>
                  <span className="text-xs text-cyan-400 font-medium">156</span>
                </div>
                <motion.div className="h-2 rounded-full bg-white/10 overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-400"
                    animate={{ width: ['0%', '64%'] }}
                    transition={{ duration: 2, ease: 'easeOut', delay: 0.4 }}
                  />
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    title: 'ROI Tracking',
    description: 'Measure impact and optimize spending in real-time',
    dashboardContent: (
      <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.04] to-white/[0.02] p-8 backdrop-blur-xl">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg bg-gradient-to-br from-emerald-500/10 to-transparent p-4 border border-emerald-500/20">
              <p className="text-xs text-emerald-400 uppercase font-medium mb-1">Cost per Dial</p>
              <p className="text-2xl font-bold text-emerald-300">$0.47</p>
              <p className="text-xs text-emerald-400/60 mt-2">↓ 12% vs last month</p>
            </div>
            <div className="rounded-lg bg-gradient-to-br from-cyan-500/10 to-transparent p-4 border border-cyan-500/20">
              <p className="text-xs text-cyan-400 uppercase font-medium mb-1">Revenue per Call</p>
              <p className="text-2xl font-bold text-cyan-300">$126</p>
              <p className="text-xs text-cyan-400/60 mt-2">↑ 23% vs last month</p>
            </div>
          </div>
          <div className="rounded-lg bg-white/[0.03] p-4 border border-white/[0.04]">
            <p className="text-xs text-zinc-400 uppercase font-medium mb-3">This Month Projection</p>
            <div className="flex items-end gap-2">
              {[40, 65, 55, 80, 70, 90, 75].map((h, i) => (
                <motion.div
                  key={i}
                  className="flex-1 h-12 rounded-t bg-gradient-to-t from-cyan-500 to-violet-500 opacity-80"
                  style={{ height: `${h}%` }}
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity, delay: i * 0.15 }}
                />
              ))}
            </div>
            <p className="text-xs text-cyan-400 font-medium mt-3">Projected Revenue: $28,450</p>
          </div>
        </div>
      </div>
    ),
  },
];

export function AnalyticsSection() {
  return (
    <AnimatedSection
      title="Advanced Analytics & Intelligence"
      subtitle="Make data-driven decisions with real-time insights"
      logos={ANALYTICS_LOGOS}
      steps={ANALYTICS_STEPS}
      stepDurationMs={5000}
      className="bg-gradient-to-b from-zinc-950 to-black"
    />
  );
}
