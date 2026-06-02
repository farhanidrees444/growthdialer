'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Mic, Brain, ArrowRight, CheckCircle2, Loader2, Volume2 } from 'lucide-react';
import { reveal, revealContainer, EASE_OUT } from './motion';

type TabId = 'connect' | 'listen' | 'summarize';

interface Tab {
  id: TabId;
  label: string;
  icon: typeof Phone;
}

const tabs: Tab[] = [
  { id: 'connect', label: 'Connect', icon: Phone },
  { id: 'listen', label: 'Listen', icon: Mic },
  { id: 'summarize', label: 'Summarize', icon: Brain },
];

const content: Record<TabId, { title: string; description: string; features: string[] }> = {
  connect: {
    title: 'Lead Import & Power Dialer',
    description: 'Import your leads and let the power dialer work through your list. Automatic call routing, intelligent queuing, and seamless CRM sync keep your reps focused on conversations, not logistics.',
    features: ['Bulk lead import', 'Smart call routing', 'Auto-queue management', 'CRM synchronization'],
  },
  listen: {
    title: 'Real-time Call Recording',
    description: 'Every call is captured in crystal clarity. Live transcription runs in the background, catching every word so your team can stay present in the conversation.',
    features: ['HD call recording', 'Live transcription', 'Speaker identification', 'Searchable archives'],
  },
  summarize: {
    title: 'AI Conversation Intelligence',
    description: 'When the call ends, AI takes over. Automatic summaries, intent detection, and actionable insights are generated and synced to your CRM within seconds.',
    features: ['Auto-generated summaries', 'Intent classification', 'Sentiment analysis', 'CRM auto-sync'],
  },
};

// Connect View: Simulated routing script
function ConnectView() {
  const queueItems = [
    { name: 'Sarah Mitchell', company: 'TechCorp Inc.', status: 'dialing' },
    { name: 'James Wilson', company: 'Growth Labs', status: 'queued' },
    { name: 'Emily Chen', company: 'DataFlow AI', status: 'queued' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-xs text-zinc-500">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
        Power Dialer Active
      </div>
      <div className="space-y-2">
        {queueItems.map((item, i) => (
          <motion.div
            key={item.name}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1, duration: 0.4 }}
            className={`flex items-center justify-between rounded-lg border px-4 py-3 ${
              item.status === 'dialing'
                ? 'border-emerald-500/30 bg-emerald-500/5'
                : 'border-white/[0.04] bg-white/[0.02]'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                item.status === 'dialing' ? 'bg-emerald-500/20' : 'bg-white/[0.04]'
              }`}>
                {item.status === 'dialing' ? (
                  <Phone className="h-4 w-4 text-emerald-400" />
                ) : (
                  <span className="text-xs text-zinc-500">{i + 1}</span>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-200">{item.name}</p>
                <p className="text-xs text-zinc-500">{item.company}</p>
              </div>
            </div>
            {item.status === 'dialing' && (
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="flex items-center gap-2 text-xs text-emerald-400"
              >
                <Loader2 className="h-3 w-3 animate-spin" />
                Connecting...
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>
      <div className="flex items-center justify-between rounded-lg border border-white/[0.04] bg-white/[0.02] px-4 py-2 text-xs text-zinc-500">
        <span>Queue Progress</span>
        <span className="font-mono text-zinc-400">1 / 47 leads</span>
      </div>
    </div>
  );
}

// Listen View: Voice frequencies and live transcript
function ListenView() {
  const bars = Array.from({ length: 32 }, () => Math.random());

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-2 text-emerald-400">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
          Recording
        </span>
        <span className="font-mono text-zinc-500">02:34</span>
      </div>
      
      {/* Waveform visualization */}
      <div className="flex h-16 items-center justify-center gap-[2px] rounded-lg border border-white/[0.04] bg-black/30 px-4">
        {bars.map((height, i) => (
          <motion.div
            key={i}
            animate={{
              height: [height * 24 + 8, Math.random() * 24 + 8, height * 24 + 8],
            }}
            transition={{
              duration: 0.8 + Math.random() * 0.4,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="w-1 rounded-full bg-gradient-to-t from-violet-600 to-cyan-400"
            style={{ height: height * 24 + 8 }}
          />
        ))}
      </div>

      {/* Live transcript */}
      <div className="rounded-lg border border-white/[0.04] bg-white/[0.02] p-4">
        <div className="mb-2 flex items-center gap-2 text-xs text-zinc-500">
          <Volume2 className="h-3 w-3" />
          Live Transcript
        </div>
        <div className="space-y-2 text-sm">
          <p className="text-zinc-400">
            <span className="text-violet-400">Rep:</span> I understand you&apos;re looking at options for your team...
          </p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-zinc-400"
          >
            <span className="text-cyan-400">Lead:</span> Yes, we need pricing for a seat of twelve?
          </motion.p>
          <motion.span
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="inline-block h-4 w-1 bg-zinc-500"
          />
        </div>
      </div>
    </div>
  );
}

// Summarize View: Data logs and metrics
function SummarizeView() {
  const metrics = [
    { label: 'Call Duration', value: '4:32' },
    { label: 'Talk Ratio', value: '62%' },
    { label: 'Sentiment', value: 'Positive' },
  ];

  const insights = [
    { label: 'Intent: Pricing Inquiry', checked: true },
    { label: 'Budget: $15k-20k', checked: true },
    { label: 'Timeline: Q1 2025', checked: true },
    { label: 'Decision Maker: Yes', checked: true },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-xs text-zinc-500">
        <Brain className="h-3 w-3 text-violet-400" />
        AI Analysis Complete
      </div>

      {/* Metrics row */}
      <div className="grid grid-cols-3 gap-2">
        {metrics.map((m, i) => (
          <motion.div
            key={m.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="rounded-lg border border-white/[0.04] bg-white/[0.02] p-3 text-center"
          >
            <p className="text-lg font-semibold text-zinc-200">{m.value}</p>
            <p className="text-[10px] text-zinc-500">{m.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Summary */}
      <div className="rounded-lg border border-white/[0.04] bg-white/[0.02] p-4">
        <p className="mb-2 text-xs font-medium text-zinc-400">Summary</p>
        <p className="text-sm leading-relaxed text-zinc-300">
          Prospect is evaluating solutions for their 12-person sales team. 
          Interested in pricing and implementation timeline. Ready to schedule a demo next week.
        </p>
      </div>

      {/* Insights checklist */}
      <div className="space-y-2">
        {insights.map((insight, i) => (
          <motion.div
            key={insight.label}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + i * 0.1 }}
            className="flex items-center gap-2 text-sm text-zinc-400"
          >
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            {insight.label}
          </motion.div>
        ))}
      </div>

      {/* CRM sync status */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-2 text-xs text-emerald-400"
      >
        <CheckCircle2 className="h-3.5 w-3.5" />
        Synced to CRM
      </motion.div>
    </div>
  );
}

export function CallJourney() {
  const [activeTab, setActiveTab] = useState<TabId>('connect');

  return (
    <section id="call-journey" className="relative px-5 py-16 lg:px-8 lg:py-24">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-100px' }}
          variants={revealContainer}
          className="mb-14 text-center"
        >
          <motion.p variants={reveal} className="mb-3 text-[12px] font-medium uppercase tracking-[0.2em] text-zinc-600">
            The Life of One Call
          </motion.p>
          <motion.h2 variants={reveal} className="font-display text-[clamp(2rem,4vw,3.25rem)] font-light leading-[1.05] tracking-tight text-[#F5F5F7]">
            Dialed, heard, <span className="font-medium">understood</span>
          </motion.h2>
        </motion.div>

        {/* Tab Selector */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: EASE_OUT }}
          className="mb-12 flex justify-center"
        >
          <div className="inline-flex gap-1 rounded-full border border-white/[0.06] bg-white/[0.02] p-1.5 backdrop-blur-xl">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-colors ${
                    activeTab === tab.id ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="activeTabBg"
                      className="absolute inset-0 rounded-full bg-white/[0.08] border border-white/[0.1]"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <Icon className="relative z-10 h-4 w-4" />
                  <span className="relative z-10">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Content Area */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2, ease: EASE_OUT }}
          className="grid gap-8 lg:grid-cols-2 lg:gap-12"
        >
          {/* Left: Copy */}
          <div className="flex flex-col justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4, ease: EASE_OUT }}
              >
                <h3 className="text-2xl font-medium tracking-tight text-[#F5F5F7] lg:text-3xl">
                  {content[activeTab].title}
                </h3>
                <p className="mt-4 text-base leading-relaxed text-zinc-400 lg:text-lg">
                  {content[activeTab].description}
                </p>
                <ul className="mt-6 space-y-3">
                  {content[activeTab].features.map((feature, i) => (
                    <motion.li
                      key={feature}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-center gap-3 text-sm text-zinc-300"
                    >
                      <ArrowRight className="h-4 w-4 text-violet-400" />
                      {feature}
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right: Visual Display Board */}
          <div className="relative">
            <div className="rounded-2xl border border-white/[0.05] bg-zinc-950/80 p-6 backdrop-blur-md">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  transition={{ duration: 0.4, ease: EASE_OUT }}
                >
                  {activeTab === 'connect' && <ConnectView />}
                  {activeTab === 'listen' && <ListenView />}
                  {activeTab === 'summarize' && <SummarizeView />}
                </motion.div>
              </AnimatePresence>
            </div>
            
            {/* Decorative glow */}
            <div className="pointer-events-none absolute -inset-4 -z-10 rounded-3xl bg-gradient-to-br from-violet-500/10 via-transparent to-cyan-500/10 blur-2xl" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
