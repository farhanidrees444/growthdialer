'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import {
  Phone, Brain, Zap, BarChart3, Shield, Users, Headphones, MessageSquare,
  Check, TrendingUp, Play, Pause, Volume2, Mic, Target, Clock,
} from 'lucide-react';
import { LiveWaveform } from './LiveWaveform';
import { Spotlight } from './Spotlight';
import { EASE_OUT } from './motion';

// Feature tabs data
const FEATURE_TABS = [
  {
    id: 'dialer',
    icon: Phone,
    label: 'AI Dialer',
    title: 'Three modes. One focused stage.',
    description: 'Browse, preview, or power through your list — the AI dialer adapts to how you work and keeps every conversation in context.',
    features: [
      'Browse mode for exploring leads',
      'Preview mode with AI context',
      'Power mode for max velocity',
      'Real-time call controls',
    ],
  },
  {
    id: 'intelligence',
    icon: Brain,
    label: 'Call Intelligence',
    title: 'AI listens. You close deals.',
    description: 'Every call is automatically transcribed, analyzed for sentiment, and distilled into actionable insights the moment you hang up.',
    features: [
      'Real-time transcription',
      'Sentiment analysis',
      'Intent detection',
      'Automated summaries',
    ],
  },
  {
    id: 'power',
    icon: Zap,
    label: 'Power Dialer',
    title: 'Work the list, not the dialer.',
    description: 'Auto-advance through your queue with intelligent pacing. One-tap dispositions keep you moving without losing context.',
    features: [
      'Automatic queue advancement',
      'Smart call pacing',
      'One-tap dispositions',
      'Voicemail drop',
    ],
  },
  {
    id: 'analytics',
    icon: BarChart3,
    label: 'Analytics',
    title: 'See what actually works.',
    description: 'Track connect rates, talk time, and conversion trends. Understand your best performers and replicate their success.',
    features: [
      'Connect rate tracking',
      'Disposition analytics',
      'Performance leaderboards',
      'Trend visualization',
    ],
  },
  {
    id: 'coaching',
    icon: Users,
    label: 'Team Coaching',
    title: 'Coach reps in real-time.',
    description: 'Listen in on live calls, whisper guidance, or jump in when needed. Review recordings with AI-highlighted key moments.',
    features: [
      'Live call monitoring',
      'Whisper coaching',
      'Barge-in capability',
      'AI call scoring',
    ],
  },
  {
    id: 'numbers',
    icon: Shield,
    label: 'Number Health',
    title: 'Keep your calls landing.',
    description: 'Monitor carrier reputation and spam risk across all your numbers. Stay ahead of issues before they impact connect rates.',
    features: [
      'Spam score monitoring',
      'Carrier reputation',
      'Auto number rotation',
      'Health alerts',
    ],
  },
];

// Visual components for each tab
function DialerVisual() {
  const [mode, setMode] = useState(0);
  const modes = ['Browse', 'Preview', 'Power'];
  
  useEffect(() => {
    const interval = setInterval(() => setMode((m) => (m + 1) % modes.length), 2500);
    return () => clearInterval(interval);
  }, [modes.length]);

  const leads = [
    { name: 'Sarah Chen', company: 'Acme Corp', status: 'Ready' },
    { name: 'Mike Johnson', company: 'TechStart', status: 'Hot' },
    { name: 'Lisa Park', company: 'Enterprise Co', status: 'Callback' },
  ];

  return (
    <div className="space-y-4">
      {/* Mode selector */}
      <div className="flex gap-1 rounded-xl bg-white/[0.04] p-1">
        {modes.map((m, i) => (
          <button
            key={m}
            onClick={() => setMode(i)}
            className={`relative flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              mode === i ? 'text-white' : 'text-zinc-500'
            }`}
          >
            {mode === i && (
              <motion.div
                layoutId="mode-bg"
                className="absolute inset-0 rounded-lg bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED]"
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
            )}
            <span className="relative">{m}</span>
          </button>
        ))}
      </div>

      {/* Lead list */}
      <div className="space-y-2">
        {leads.map((lead, i) => (
          <motion.div
            key={lead.name}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`flex items-center justify-between rounded-xl border p-3 transition-colors ${
              i === 0 && mode > 0
                ? 'border-[#8B5CF6]/30 bg-[#8B5CF6]/5'
                : 'border-white/[0.06] bg-white/[0.02]'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-zinc-700 to-zinc-800 text-xs font-semibold text-white">
                {lead.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <p className="text-sm font-medium text-white">{lead.name}</p>
                <p className="text-xs text-zinc-500">{lead.company}</p>
              </div>
            </div>
            <span className={`rounded-full px-2 py-1 text-[10px] font-medium ${
              lead.status === 'Hot' ? 'bg-orange-500/10 text-orange-400' :
              lead.status === 'Callback' ? 'bg-amber-500/10 text-amber-400' :
              'bg-zinc-500/10 text-zinc-400'
            }`}>
              {lead.status}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Action button */}
      {mode > 0 && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] py-3 text-sm font-semibold text-white"
        >
          {mode === 2 ? 'Start Power Session' : 'Call Sarah Chen'}
        </motion.button>
      )}
    </div>
  );
}

function IntelligenceVisual() {
  const [transcribing, setTranscribing] = useState(true);
  const lines = [
    { speaker: 'Rep', text: 'I understand you\'re looking to scale your outbound...' },
    { speaker: 'Prospect', text: 'Yes, we need something that can handle 50+ reps.' },
    { speaker: 'Rep', text: 'Perfect. Our power dialer is built exactly for that scale.' },
  ];

  useEffect(() => {
    const timer = setInterval(() => setTranscribing(t => !t), 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="space-y-4">
      {/* Live transcription */}
      <div className="rounded-xl border border-white/[0.06] bg-black/30 p-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="flex items-center gap-2 text-xs text-zinc-500">
            <span className={`h-2 w-2 rounded-full ${transcribing ? 'bg-[#06B6D4] animate-pulse' : 'bg-zinc-600'}`} />
            {transcribing ? 'Transcribing...' : 'Paused'}
          </span>
          <span className="font-mono text-xs text-zinc-600">02:34</span>
        </div>
        <div className="space-y-2">
          {lines.map((line, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.2 }}
              className="flex gap-2"
            >
              <span className={`text-[11px] font-medium ${
                line.speaker === 'Rep' ? 'text-[#8B5CF6]' : 'text-[#06B6D4]'
              }`}>
                {line.speaker}:
              </span>
              <span className="text-xs text-zinc-300">{line.text}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* AI insights */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
          <p className="mb-1 text-[10px] uppercase tracking-wider text-zinc-600">Sentiment</p>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-400" />
            <span className="text-sm font-medium text-emerald-400">Positive</span>
          </div>
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
          <p className="mb-1 text-[10px] uppercase tracking-wider text-zinc-600">Intent</p>
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-[#8B5CF6]" />
            <span className="text-sm font-medium text-[#8B5CF6]">High Interest</span>
          </div>
        </div>
      </div>

      {/* Summary generating */}
      <div className="rounded-xl border border-[#8B5CF6]/20 bg-[#8B5CF6]/5 p-3">
        <p className="mb-2 flex items-center gap-2 text-xs text-[#8B5CF6]">
          <Brain className="h-3.5 w-3.5" />
          AI Summary
        </p>
        <p className="text-xs text-zinc-300">
          Prospect interested in scaling to 50+ reps. Key pain points: current tool lacks power dialing. 
          <motion.span
            className="ml-1 inline-block h-3 w-[2px] bg-[#8B5CF6]"
            animate={{ opacity: [1, 0, 1] }}
            transition={{ duration: 0.8, repeat: Infinity }}
          />
        </p>
      </div>
    </div>
  );
}

function PowerDialerVisual() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const queue = [
    { name: 'Alex Turner', status: 'connected', time: '1:24' },
    { name: 'Maya Chen', status: 'calling', time: '—' },
    { name: 'Tom Becker', status: 'pending', time: '—' },
    { name: 'Priya Nair', status: 'pending', time: '—' },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((i) => (i + 1) % queue.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [queue.length]);

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div>
        <div className="mb-2 flex justify-between text-xs">
          <span className="text-zinc-500">Session Progress</span>
          <span className="text-[#8B5CF6]">{currentIndex + 1}/{queue.length} calls</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4]"
            initial={{ width: 0 }}
            animate={{ width: `${((currentIndex + 1) / queue.length) * 100}%` }}
            transition={{ duration: 0.5, ease: EASE_OUT }}
          />
        </div>
      </div>

      {/* Queue */}
      <div className="space-y-2">
        {queue.map((lead, i) => {
          const isCurrent = i === currentIndex;
          const isDone = i < currentIndex;
          return (
            <motion.div
              key={lead.name}
              animate={{
                borderColor: isCurrent ? 'rgba(6, 182, 212, 0.3)' : 'rgba(255,255,255,0.06)',
                backgroundColor: isCurrent ? 'rgba(6, 182, 212, 0.05)' : 'rgba(255,255,255,0.02)',
              }}
              className="flex items-center justify-between rounded-xl border p-3"
            >
              <div className="flex items-center gap-3">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${
                  isDone ? 'bg-emerald-500/20 text-emerald-400' :
                  isCurrent ? 'bg-[#06B6D4]/20 text-[#06B6D4]' :
                  'bg-white/[0.06] text-zinc-500'
                }`}>
                  {isDone ? <Check className="h-4 w-4" /> : lead.name.split(' ').map(n => n[0]).join('')}
                </div>
                <span className={`text-sm ${isCurrent ? 'font-medium text-white' : 'text-zinc-400'}`}>
                  {lead.name}
                </span>
              </div>
              <span className={`text-xs font-medium ${
                isDone ? 'text-emerald-400' :
                isCurrent ? 'text-[#06B6D4]' :
                'text-zinc-600'
              }`}>
                {isDone ? 'Connected' : isCurrent ? 'Dialing...' : 'Queued'}
              </span>
            </motion.div>
          );
        })}
      </div>

      {/* Live call indicator */}
      {currentIndex < queue.length && (
        <div className="rounded-xl border border-[#06B6D4]/20 bg-[#06B6D4]/5 p-3">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-xs text-[#06B6D4]">
              <Phone className="h-3.5 w-3.5" />
              On call
            </span>
            <LiveWaveform bars={16} height={20} barWidth={2} gap={2} />
          </div>
        </div>
      )}
    </div>
  );
}

function AnalyticsVisual() {
  const weekData = [42, 68, 55, 82, 71, 94, 78];
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="space-y-4">
      {/* KPI row */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Connect Rate', value: '68%', trend: '+12%', color: 'text-emerald-400' },
          { label: 'Calls Today', value: '142', trend: '+8%', color: 'text-[#8B5CF6]' },
          { label: 'Meetings', value: '12', trend: '+25%', color: 'text-[#06B6D4]' },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
            <p className="text-lg font-semibold text-white">{kpi.value}</p>
            <p className="text-[10px] text-zinc-600">{kpi.label}</p>
            <p className={`text-[10px] font-medium ${kpi.color}`}>{kpi.trend}</p>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
        <p className="mb-4 text-xs text-zinc-500">Weekly Calls</p>
        <div className="flex h-24 items-end justify-between gap-2">
          {weekData.map((value, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${value}%` }}
                transition={{ duration: 0.5, delay: i * 0.05, ease: EASE_OUT }}
                className={`w-full rounded-t ${
                  i === 5 ? 'bg-gradient-to-t from-[#8B5CF6] to-[#06B6D4]' : 'bg-white/[0.1]'
                }`}
              />
              <span className="text-[10px] text-zinc-600">{days[i]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Disposition breakdown */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: 'Interested', count: 32, color: 'bg-emerald-500' },
          { label: 'Callback', count: 18, color: 'bg-amber-500' },
          { label: 'Voicemail', count: 45, color: 'bg-zinc-500' },
          { label: 'No Answer', count: 28, color: 'bg-rose-500' },
        ].map((d) => (
          <div key={d.label} className="flex items-center gap-2 rounded-lg border border-white/[0.06] p-2">
            <div className={`h-2 w-2 rounded-full ${d.color}`} />
            <span className="text-xs text-zinc-400">{d.label}</span>
            <span className="ml-auto text-xs font-medium text-zinc-300">{d.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CoachingVisual() {
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setIsListening(l => !l), 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-4">
      {/* Live calls */}
      <div className="rounded-xl border border-white/[0.06] bg-black/30 p-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs text-zinc-500">Active Calls</span>
          <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-1 text-[10px] font-medium text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            3 live
          </span>
        </div>
        <div className="space-y-2">
          {[
            { rep: 'Sarah M.', lead: 'Acme Corp', time: '02:34', score: 92 },
            { rep: 'John D.', lead: 'TechStart', time: '01:12', score: 78 },
            { rep: 'Lisa P.', lead: 'Enterprise', time: '00:45', score: 85 },
          ].map((call, i) => (
            <div
              key={call.rep}
              className={`flex items-center justify-between rounded-lg p-2 ${
                i === 0 && isListening ? 'border border-[#8B5CF6]/30 bg-[#8B5CF6]/5' : 'bg-white/[0.02]'
              }`}
            >
              <div className="flex items-center gap-2">
                <Headphones className={`h-3.5 w-3.5 ${
                  i === 0 && isListening ? 'text-[#8B5CF6]' : 'text-zinc-600'
                }`} />
                <div>
                  <p className="text-xs font-medium text-white">{call.rep}</p>
                  <p className="text-[10px] text-zinc-600">{call.lead}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-mono text-xs text-zinc-400">{call.time}</p>
                <p className={`text-[10px] ${call.score >= 85 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  Score: {call.score}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Coaching actions */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { icon: Headphones, label: 'Listen', active: isListening },
          { icon: MessageSquare, label: 'Whisper', active: false },
          { icon: Volume2, label: 'Barge', active: false },
        ].map((action) => (
          <button
            key={action.label}
            className={`flex flex-col items-center gap-1 rounded-xl border p-3 transition-colors ${
              action.active
                ? 'border-[#8B5CF6]/30 bg-[#8B5CF6]/10 text-[#8B5CF6]'
                : 'border-white/[0.06] text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <action.icon className="h-4 w-4" />
            <span className="text-[10px]">{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function NumberHealthVisual() {
  return (
    <div className="space-y-4">
      {/* Numbers */}
      {[
        { number: '+1 (415) 555-0148', health: 95, status: 'Healthy', calls: 234 },
        { number: '+1 (628) 555-0199', health: 78, status: 'Monitor', calls: 156 },
        { number: '+1 (510) 555-0123', health: 92, status: 'Healthy', calls: 189 },
      ].map((num, i) => (
        <motion.div
          key={num.number}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.1 }}
          className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3"
        >
          <div className="mb-2 flex items-center justify-between">
            <span className="font-mono text-sm text-white">{num.number}</span>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
              num.status === 'Healthy' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
            }`}>
              {num.status}
            </span>
          </div>
          <div className="mb-1 flex items-center justify-between text-[10px]">
            <span className="text-zinc-600">Health Score</span>
            <span className={num.health >= 90 ? 'text-emerald-400' : 'text-amber-400'}>
              {num.health}/100
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${num.health}%` }}
              transition={{ duration: 0.5, delay: 0.2 + i * 0.1, ease: EASE_OUT }}
              className={`h-full rounded-full ${
                num.health >= 90
                  ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                  : 'bg-gradient-to-r from-amber-500 to-amber-400'
              }`}
            />
          </div>
          <p className="mt-1.5 text-[10px] text-zinc-600">{num.calls} calls this week</p>
        </motion.div>
      ))}
    </div>
  );
}

const VISUALS: Record<string, () => JSX.Element> = {
  dialer: DialerVisual,
  intelligence: IntelligenceVisual,
  power: PowerDialerVisual,
  analytics: AnalyticsVisual,
  coaching: CoachingVisual,
  numbers: NumberHealthVisual,
};

export function TabbedFeatures() {
  const [activeTab, setActiveTab] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: '-100px' });

  // Auto-rotate tabs
  useEffect(() => {
    if (!isInView) return;
    const interval = setInterval(() => {
      setActiveTab((t) => (t + 1) % FEATURE_TABS.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [isInView]);

  const active = FEATURE_TABS[activeTab];
  const Visual = VISUALS[active.id];

  return (
    <section id="features" ref={containerRef} className="relative px-5 py-20 lg:px-8 lg:py-28">
      {/* Background gradient */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-[0.07] blur-[150px]"
        style={{ background: 'radial-gradient(circle, #8B5CF6 0%, #06B6D4 50%, transparent 70%)' }}
      />

      <div className="relative mx-auto max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: EASE_OUT }}
          className="mb-12 text-center"
        >
          <p className="mb-3 text-[12px] font-medium uppercase tracking-[0.2em] text-[#8B5CF6]">
            Features
          </p>
          <h2 className="mx-auto max-w-2xl font-display text-[clamp(2rem,4vw,3.25rem)] font-light leading-[1.05] tracking-tight text-[#F5F5F7]">
            Everything you need to{' '}
            <span className="font-medium">close more deals</span>
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-[16px] leading-relaxed text-zinc-400">
            A complete AI-powered platform for modern sales teams. From dialing to analytics, 
            every feature is designed to help you connect and convert.
          </p>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: EASE_OUT, delay: 0.1 }}
          className="mb-12"
        >
          <div className="flex flex-wrap justify-center gap-2">
            {FEATURE_TABS.map((tab, i) => {
              const Icon = tab.icon;
              const isActive = i === activeTab;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(i)}
                  className={`group relative flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
                    isActive ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="tab-bg"
                      className="absolute inset-0 rounded-xl border border-white/[0.1] bg-white/[0.05]"
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                  <Icon className={`relative h-4 w-4 ${isActive ? 'text-[#8B5CF6]' : ''}`} />
                  <span className="relative">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Progress bar */}
          <div className="mx-auto mt-4 h-1 max-w-md overflow-hidden rounded-full bg-white/[0.06]">
            <motion.div
              key={activeTab}
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ duration: 6, ease: 'linear' }}
              className="h-full rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4]"
            />
          </div>
        </motion.div>

        {/* Content */}
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left: Copy */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.4, ease: EASE_OUT }}
            >
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.02] py-1 pl-1.5 pr-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#8B5CF6]/15 text-[#8B5CF6]">
                  <active.icon className="h-3.5 w-3.5" />
                </span>
                <span className="text-[12px] font-medium text-zinc-400">{active.label}</span>
              </div>
              <h3 className="font-display text-[clamp(1.75rem,3.5vw,2.75rem)] font-light leading-[1.1] tracking-tight text-[#F5F5F7]">
                {active.title}
              </h3>
              <p className="mt-4 max-w-md text-[15px] leading-relaxed text-zinc-400">
                {active.description}
              </p>
              <ul className="mt-6 space-y-3">
                {active.features.map((feature, i) => (
                  <motion.li
                    key={feature}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + i * 0.1 }}
                    className="flex items-center gap-3 text-[14px] text-zinc-300"
                  >
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#8B5CF6]/10">
                      <Check className="h-3 w-3 text-[#8B5CF6]" />
                    </span>
                    {feature}
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          </AnimatePresence>

          {/* Right: Visual */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.98 }}
              transition={{ duration: 0.4, ease: EASE_OUT }}
            >
              <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0A0A0D]/90 p-6 backdrop-blur-xl">
                <Spotlight color="#8B5CF6" />
                <Visual />
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
