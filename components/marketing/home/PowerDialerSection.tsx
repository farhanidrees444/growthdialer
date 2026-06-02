'use client';

import { motion } from 'framer-motion';
import { SiTwilio, SiZoom, SiSlack, SiGooglemeet, SiDiscord, SiSkype } from 'react-icons/si';
import { AnimatedSection, type StepContent } from './AnimatedSection';

const DIALER_LOGOS: [typeof SiTwilio, string][] = [
  [SiTwilio, 'Twilio'],
  [SiZoom, 'Zoom'],
  [SiSlack, 'Slack'],
  [SiGooglemeet, 'Google Meet'],
  [SiDiscord, 'Discord'],
  [SiSkype, 'Skype'],
];

const DIALER_STEPS: StepContent[] = [
  {
    title: 'Queue Setup',
    description: 'Build your call list and campaigns in seconds',
    dashboardContent: (
      <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.04] to-white/[0.02] p-8 backdrop-blur-xl">
        <div className="space-y-4">
          <div className="rounded-xl bg-white/[0.02] p-4 border border-white/[0.04]">
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-3">Active Campaigns</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-white">Summer 2024 Launch</span>
                <motion.div className="h-2 flex-1 mx-3 rounded-full bg-white/10 overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-violet-500 to-cyan-400"
                    animate={{ width: ['0%', '45%'] }}
                    transition={{ duration: 3, ease: 'easeInOut' }}
                  />
                </motion.div>
                <span className="text-xs text-cyan-400 font-medium">45 calls</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-white">Q3 Expansion</span>
                <motion.div className="h-2 flex-1 mx-3 rounded-full bg-white/10 overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-violet-500 to-cyan-400"
                    animate={{ width: ['0%', '72%'] }}
                    transition={{ duration: 3, ease: 'easeInOut', delay: 0.2 }}
                  />
                </motion.div>
                <span className="text-xs text-cyan-400 font-medium">72 calls</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg bg-white/[0.03] p-3 text-center border border-white/[0.04]">
              <p className="text-2xl font-bold text-violet-400">156</p>
              <p className="text-xs text-zinc-400 mt-1">Total Contacts</p>
            </div>
            <div className="rounded-lg bg-white/[0.03] p-3 text-center border border-white/[0.04]">
              <p className="text-2xl font-bold text-cyan-400">3</p>
              <p className="text-xs text-zinc-400 mt-1">Active Lists</p>
            </div>
            <div className="rounded-lg bg-white/[0.03] p-3 text-center border border-white/[0.04]">
              <p className="text-2xl font-bold text-emerald-400">92%</p>
              <p className="text-xs text-zinc-400 mt-1">Quality Score</p>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    title: 'Smart Dialing',
    description: 'Predictive dialing connects you only to live conversations',
    dashboardContent: (
      <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.04] to-white/[0.02] p-8 backdrop-blur-xl">
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <motion.div
              className="rounded-lg bg-gradient-to-br from-emerald-500/10 to-transparent p-4 border border-emerald-500/20 text-center"
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <p className="text-3xl font-bold text-emerald-400">18</p>
              <p className="text-xs text-emerald-300 mt-1">Connected</p>
            </motion.div>
            <motion.div
              className="rounded-lg bg-gradient-to-br from-blue-500/10 to-transparent p-4 border border-blue-500/20 text-center"
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.2 }}
            >
              <p className="text-3xl font-bold text-blue-400">47</p>
              <p className="text-xs text-blue-300 mt-1">Dialing</p>
            </motion.div>
          </div>
          <div className="space-y-2">
            <p className="text-xs text-zinc-500 uppercase tracking-wider">Live Performance</p>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between text-zinc-400">
                <span>Connected Rate</span>
                <span>68%</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Talk Time Avg</span>
                <span>6m 24s</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Next Dial</span>
                <span className="text-cyan-400 animate-pulse">3s...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    title: 'Optimize & Scale',
    description: 'Data-driven insights improve your dialing strategy',
    dashboardContent: (
      <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.04] to-white/[0.02] p-8 backdrop-blur-xl">
        <div className="space-y-4">
          <div className="rounded-xl bg-white/[0.02] p-4 border border-white/[0.04]">
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-3">Session Analytics</p>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Best Time to Call</span>
                <span className="text-white font-medium">9 AM - 11 AM</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Top Performer</span>
                <span className="text-cyan-400 font-medium">Sarah M. (71% connect)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Recommended Daily</span>
                <span className="text-emerald-400 font-medium">180 dials</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button className="px-3 py-2 rounded-lg bg-violet-500/20 text-violet-300 text-xs font-medium hover:bg-violet-500/30 transition-colors">
              View Report
            </button>
            <button className="px-3 py-2 rounded-lg bg-white/5 text-zinc-400 text-xs font-medium hover:bg-white/10 transition-colors">
              Export Data
            </button>
          </div>
        </div>
      </div>
    ),
  },
];

export function PowerDialerSection() {
  return (
    <AnimatedSection
      title="The Ultimate Power Dialer"
      subtitle="Maximize connections with intelligent predictive dialing"
      logos={DIALER_LOGOS}
      steps={DIALER_STEPS}
      stepDurationMs={5000}
      className="bg-gradient-to-b from-black to-zinc-950"
    />
  );
}
