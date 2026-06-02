'use client';

import { useRef, useEffect, useState } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import {
  Database, Calendar, Mail, MessageSquare, Webhook, Workflow, Phone, Brain,
  ArrowRight, Zap, Check, ExternalLink, Slack, Chrome,
} from 'lucide-react';
import { Spotlight } from './Spotlight';
import { EASE_OUT, reveal, revealContainer } from './motion';

// Integration categories
const INTEGRATION_CATEGORIES = [
  {
    id: 'crm',
    icon: Database,
    name: 'CRM',
    description: 'Sync contacts, deals, and activities automatically',
    integrations: ['Salesforce', 'HubSpot', 'Pipedrive', 'Zoho CRM'],
    gradient: 'from-[#8B5CF6] to-[#7C3AED]',
    status: 'available',
  },
  {
    id: 'calendar',
    icon: Calendar,
    name: 'Calendar',
    description: 'Book meetings directly from your calls',
    integrations: ['Google Calendar', 'Outlook', 'Calendly'],
    gradient: 'from-[#06B6D4] to-[#0891B2]',
    status: 'available',
  },
  {
    id: 'automation',
    icon: Workflow,
    name: 'Automation',
    description: 'Trigger workflows on call events',
    integrations: ['Zapier', 'Make', 'n8n'],
    gradient: 'from-[#F59E0B] to-[#D97706]',
    status: 'available',
  },
  {
    id: 'messaging',
    icon: MessageSquare,
    name: 'Messaging',
    description: 'Send notifications and updates to your team',
    integrations: ['Slack', 'Teams', 'Discord'],
    gradient: 'from-[#10B981] to-[#059669]',
    status: 'available',
  },
  {
    id: 'email',
    icon: Mail,
    name: 'Email',
    description: 'Sync email sequences with call outcomes',
    integrations: ['Gmail', 'Outreach', 'Salesloft'],
    gradient: 'from-[#EC4899] to-[#DB2777]',
    status: 'coming',
  },
  {
    id: 'api',
    icon: Webhook,
    name: 'API & Webhooks',
    description: 'Build custom integrations with our API',
    integrations: ['REST API', 'Webhooks', 'SDKs'],
    gradient: 'from-zinc-600 to-zinc-700',
    status: 'available',
  },
];

// Animated flow diagram nodes
const FLOW_NODES = [
  { id: 'call', icon: Phone, label: 'Call Completed', x: 10, y: 50 },
  { id: 'ai', icon: Brain, label: 'AI Analysis', x: 35, y: 30 },
  { id: 'sync', icon: Database, label: 'CRM Sync', x: 60, y: 15 },
  { id: 'notify', icon: MessageSquare, label: 'Team Alert', x: 60, y: 50 },
  { id: 'book', icon: Calendar, label: 'Book Meeting', x: 60, y: 85 },
  { id: 'automate', icon: Zap, label: 'Trigger Workflow', x: 85, y: 50 },
];

// Animated connection paths
const FLOW_PATHS = [
  { from: 'call', to: 'ai', active: true },
  { from: 'ai', to: 'sync', active: true, label: 'If interested' },
  { from: 'ai', to: 'notify', active: true },
  { from: 'ai', to: 'book', active: false, label: 'If meeting' },
  { from: 'sync', to: 'automate', active: true },
  { from: 'notify', to: 'automate', active: false },
];

function FlowDiagram() {
  const [activeStep, setActiveStep] = useState(0);
  const steps = ['call', 'ai', 'sync', 'notify', 'automate'];
  
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((s) => (s + 1) % steps.length);
    }, 1500);
    return () => clearInterval(interval);
  }, [steps.length]);

  return (
    <div className="relative h-[300px] w-full overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0A0A0D]/90 p-6">
      <Spotlight color="#8B5CF6" />
      
      {/* Grid background */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `
            radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)
          `,
          backgroundSize: '24px 24px',
        }}
      />

      {/* Connection lines (SVG) */}
      <svg className="absolute inset-0 h-full w-full" style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id="line-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.5" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        
        {/* Animated paths */}
        {[
          { x1: '15%', y1: '50%', x2: '35%', y2: '35%' },
          { x1: '40%', y1: '35%', x2: '58%', y2: '20%' },
          { x1: '40%', y1: '35%', x2: '58%', y2: '50%' },
          { x1: '40%', y1: '35%', x2: '58%', y2: '80%' },
          { x1: '68%', y1: '50%', x2: '82%', y2: '50%' },
        ].map((path, i) => (
          <motion.line
            key={i}
            x1={path.x1}
            y1={path.y1}
            x2={path.x2}
            y2={path.y2}
            stroke="url(#line-gradient)"
            strokeWidth="2"
            strokeDasharray="8 4"
            initial={{ pathLength: 0, opacity: 0.3 }}
            animate={{ 
              pathLength: 1, 
              opacity: activeStep >= i ? 0.8 : 0.2,
            }}
            transition={{ duration: 0.5, delay: i * 0.2 }}
            filter={activeStep === i ? 'url(#glow)' : undefined}
          />
        ))}
      </svg>

      {/* Flow nodes */}
      {FLOW_NODES.map((node, i) => {
        const Icon = node.icon;
        const isActive = activeStep >= steps.indexOf(node.id);
        const isCurrent = steps[activeStep] === node.id;
        
        return (
          <motion.div
            key={node.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ 
              opacity: 1, 
              scale: 1,
              borderColor: isCurrent ? 'rgba(139, 92, 246, 0.5)' : isActive ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.06)',
              backgroundColor: isCurrent ? 'rgba(139, 92, 246, 0.1)' : 'rgba(255,255,255,0.02)',
            }}
            transition={{ duration: 0.4, delay: i * 0.1 }}
            className="absolute flex flex-col items-center gap-2"
            style={{ 
              left: `${node.x}%`, 
              top: `${node.y}%`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <div 
              className={`flex h-12 w-12 items-center justify-center rounded-xl border transition-colors ${
                isCurrent ? 'border-[#8B5CF6]/50 bg-[#8B5CF6]/10' :
                isActive ? 'border-white/[0.12] bg-white/[0.04]' :
                'border-white/[0.06] bg-white/[0.02]'
              }`}
            >
              <Icon className={`h-5 w-5 ${isCurrent ? 'text-[#8B5CF6]' : isActive ? 'text-zinc-300' : 'text-zinc-600'}`} />
            </div>
            <span className={`whitespace-nowrap text-[10px] font-medium ${
              isCurrent ? 'text-[#8B5CF6]' : isActive ? 'text-zinc-400' : 'text-zinc-600'
            }`}>
              {node.label}
            </span>
          </motion.div>
        );
      })}

      {/* Active indicator pulse */}
      <motion.div
        className="absolute h-4 w-4 rounded-full bg-[#8B5CF6]"
        animate={{
          left: `${FLOW_NODES.find(n => n.id === steps[activeStep])?.x ?? 0}%`,
          top: `${FLOW_NODES.find(n => n.id === steps[activeStep])?.y ?? 0}%`,
          scale: [1, 1.5, 1],
          opacity: [0.5, 0, 0.5],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{ transform: 'translate(-50%, -50%)' }}
      />
    </div>
  );
}

function IntegrationCard({ 
  integration, 
  index 
}: { 
  integration: typeof INTEGRATION_CATEGORIES[0];
  index: number;
}) {
  const Icon = integration.icon;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: EASE_OUT, delay: index * 0.1 }}
      whileHover={{ y: -4 }}
      className="group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 backdrop-blur-xl transition-colors hover:border-white/[0.12]"
    >
      <Spotlight color={integration.gradient.split(' ')[0].replace('from-[', '').replace(']', '')} />
      
      {/* Gradient accent */}
      <div className={`absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r ${integration.gradient} opacity-0 transition-opacity group-hover:opacity-100`} />
      
      {/* Icon */}
      <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${integration.gradient}`}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      
      {/* Content */}
      <div className="mb-4">
        <div className="mb-1 flex items-center gap-2">
          <h3 className="text-base font-semibold text-white">{integration.name}</h3>
          {integration.status === 'coming' && (
            <span className="rounded-full border border-zinc-700 bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-400">
              Coming Soon
            </span>
          )}
        </div>
        <p className="text-sm text-zinc-500">{integration.description}</p>
      </div>
      
      {/* Integration logos */}
      <div className="flex flex-wrap gap-2">
        {integration.integrations.map((name) => (
          <span
            key={name}
            className="rounded-full border border-white/[0.06] bg-white/[0.03] px-2.5 py-1 text-[11px] text-zinc-400"
          >
            {name}
          </span>
        ))}
      </div>
    </motion.div>
  );
}

export function IntegrationsSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: '-100px' });

  return (
    <section id="integrations" ref={containerRef} className="relative px-5 py-20 lg:px-8 lg:py-28">
      {/* Background */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-[0.05] blur-[150px]"
        style={{ background: 'radial-gradient(circle, #8B5CF6 0%, #06B6D4 50%, transparent 70%)' }}
      />

      <div className="relative mx-auto max-w-7xl">
        {/* Header */}
        <motion.div
          initial="hidden"
          animate={isInView ? "show" : "hidden"}
          variants={revealContainer}
          className="mb-12 text-center"
        >
          <motion.p variants={reveal} className="mb-3 text-[12px] font-medium uppercase tracking-[0.2em] text-[#8B5CF6]">
            Integrations
          </motion.p>
          <motion.h2 variants={reveal} className="mx-auto max-w-2xl font-display text-[clamp(2rem,4vw,3.25rem)] font-light leading-[1.05] tracking-tight text-[#F5F5F7]">
            Connect your entire{' '}
            <span className="font-medium">sales stack</span>
          </motion.h2>
          <motion.p variants={reveal} className="mx-auto mt-4 max-w-lg text-[16px] leading-relaxed text-zinc-400">
            Seamlessly integrate with your CRM, calendar, and automation tools. 
            Every call syncs automatically so your team stays in the loop.
          </motion.p>
        </motion.div>

        {/* Flow diagram */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: EASE_OUT, delay: 0.2 }}
          className="mb-16"
        >
          <p className="mb-4 text-center text-sm text-zinc-500">
            See how a single call triggers your entire workflow
          </p>
          <FlowDiagram />
        </motion.div>

        {/* Integration cards grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {INTEGRATION_CATEGORIES.map((integration, i) => (
            <IntegrationCard key={integration.id} integration={integration} index={i} />
          ))}
        </div>

        {/* API callout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: EASE_OUT, delay: 0.5 }}
          className="mt-12 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 backdrop-blur-xl"
        >
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-zinc-600 to-zinc-700">
                <Webhook className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">Build custom integrations</h3>
                <p className="text-sm text-zinc-500">Full REST API access with webhooks and real-time events</p>
              </div>
            </div>
            <a
              href="/docs/api"
              className="group inline-flex items-center gap-2 rounded-xl border border-white/[0.08] px-4 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:border-white/[0.16] hover:text-white"
            >
              View API Docs
              <ExternalLink className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
