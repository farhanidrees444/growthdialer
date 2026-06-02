'use client';

import { motion } from 'framer-motion';
import { Phone, Sparkles, ArrowRight, ShieldCheck, Activity } from 'lucide-react';

export function Hero() {
  return (
    <section className="relative min-h-screen bg-[#050507] text-white flex flex-col justify-center items-center overflow-hidden px-6 md:px-12 py-20">
      
      {/* Deep Space Atmospheric Glow */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-purple-600/[0.06] blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[0%] right-[-10%] w-[700px] h-[700px] bg-blue-600/[0.04] blur-[160px] rounded-full pointer-events-none" />

      {/* Micro-Dot Matrix Layer */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff02_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

      <div className="max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center z-10">
        
        {/* LEFT COLUMN: Crisp, Authoritative Copy & CTAs */}
        <div className="lg:col-span-6 space-y-8 text-left">
          
          {/* Floating Live Indicator Badge */}
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.02] border border-white/[0.06] backdrop-blur-md"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
            </span>
            <span className="text-[11px] font-mono tracking-wider text-zinc-400 uppercase flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-purple-400" /> Live AI Sales Dialer
            </span>
          </motion.div>

          {/* Cinematic Shimmer Header */}
          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tighter leading-[1.1] bg-gradient-to-b from-white via-zinc-200 to-zinc-500 bg-clip-text text-transparent">
              Every call,<br />understood the<br />moment it ends.
            </h1>
            <p className="text-zinc-400 text-base md:text-lg max-w-lg leading-relaxed font-normal">
              GrowthDialer is the AI dialer that records, transcribes, and analyzes every conversation—turning raw calls into summaries, sentiment, and next steps without a single note.
            </p>
          </div>

          {/* Premium Interaction Buttons */}
          <div className="flex flex-wrap items-center gap-4">
            <a 
              href="https://app.growthdialer.com/signup"
              className="group relative flex items-center gap-2 bg-white text-black font-semibold text-sm px-8 py-4 rounded-xl transition-all duration-300 hover:bg-zinc-100 hover:shadow-[0_0_35px_rgba(255,255,255,0.15)] active:scale-[0.99]"
            >
              Start Free Today
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </a>
            
            <a 
              href="https://app.growthdialer.com/login"
              className="px-7 py-4 rounded-xl font-medium text-sm text-zinc-300 bg-white/[0.02] border border-white/[0.06] backdrop-blur-md hover:bg-white/[0.05] hover:text-white transition-colors"
            >
              Log in
            </a>
          </div>

          {/* Micro Trust Badges */}
          <div className="flex items-center gap-6 pt-4 border-t border-white/[0.04] max-w-md">
            <div className="flex items-center gap-2 text-xs font-mono text-zinc-500">
              <ShieldCheck className="w-4 h-4 text-emerald-500/70" /> 10DLC Registered Compliance
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-zinc-500">
              <Activity className="w-4 h-4 text-purple-500/70" /> Tier-1 Carrier Networks
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: The Hyper-Relevant "Live Dialer" App Mockup */}
        <div className="lg:col-span-6 flex justify-center lg:justify-end">
          <motion.div 
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 90, damping: 20 }}
            className="w-full max-w-xl bg-[#0b0b0e]/50 backdrop-blur-2xl border border-white/[0.08] rounded-2xl p-6 shadow-[0_25px_60px_rgba(0,0,0,0.5)] relative overflow-hidden group"
          >
            {/* Top Border Light Pulse */}
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />
            
            {/* Mockup Windows Controls */}
            <div className="flex items-center justify-between border-b border-white/[0.05] pb-4 mb-6">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-zinc-800" />
                <span className="w-2.5 h-2.5 rounded-full bg-zinc-800" />
                <span className="w-2.5 h-2.5 rounded-full bg-zinc-800" />
                <span className="text-[10px] font-mono text-zinc-500 ml-2">active_dialer_node_v1.0</span>
              </div>
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded-md">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-mono font-medium text-red-400 tracking-wider uppercase">Live Stream</span>
              </div>
            </div>

            {/* Active Contact State Header */}
            <div className="bg-white/[0.01] border border-white/[0.04] rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                  <Phone className="w-4 h-4 animate-bounce" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">Jordan at Acme Co.</h4>
                  <p className="text-[11px] font-mono text-zinc-500">Connected 2:37</p>
                </div>
              </div>
              <span className="text-xs font-mono text-zinc-400 bg-white/[0.04] px-2.5 py-1 rounded border border-white/[0.04]">
                Line 1 Active
              </span>
            </div>

            {/* Dynamic Real-Time Waveform Visualization */}
            <div className="my-6 space-y-2">
              <p className="text-[10px] font-mono text-zinc-500 tracking-wider uppercase">Voice Stream Tokenizer</p>
              <div className="h-16 w-full bg-zinc-950/60 rounded-xl border border-white/[0.02] flex items-center justify-center gap-1 px-4">
                {[40, 70, 25, 60, 90, 45, 30, 85, 50, 75, 20, 60, 40, 80, 95, 35, 55, 30].map((h, i) => (
                  <motion.div
                    key={i}
                    className="w-[3px] bg-gradient-to-t from-purple-600 via-purple-400 to-indigo-400 rounded-full"
                    animate={{ height: [h * 0.3, h, h * 0.3] }}
                    transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.04, ease: "easeInOut" }}
                  />
                ))}
              </div>
              <p className="text-xs italic text-zinc-400 pl-1 font-mono">&ldquo;...pricing for a seat of twelve?&rdquo;</p>
            </div>

            {/* AI Core Extraction Engine Layer */}
            <div className="space-y-3">
              <p className="text-[10px] font-mono text-zinc-500 tracking-wider uppercase">Realtime AI Insights</p>
              
              {/* Pill 1 */}
              <motion.div 
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="flex items-center gap-3 p-3 bg-emerald-500/[0.03] border border-emerald-500/20 rounded-xl"
              >
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-xs font-medium text-emerald-300">Positive sentiment</span>
              </motion.div>

              {/* Pill 2 */}
              <motion.div 
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="flex items-center gap-3 p-3 bg-purple-500/[0.03] border border-purple-500/20 rounded-xl"
              >
                <div className="w-2 h-2 rounded-full bg-purple-400" />
                <span className="text-xs font-medium text-purple-300">Evaluating 12-seat team</span>
              </motion.div>

              {/* Pill 3 */}
              <motion.div 
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 }}
                className="flex items-center gap-3 p-3 bg-blue-500/[0.03] border border-blue-500/20 rounded-xl"
              >
                <div className="w-2 h-2 rounded-full bg-blue-400" />
                <span className="text-xs font-medium text-blue-300">Follow up Thursday</span>
              </motion.div>
            </div>

          </motion.div>
        </div>

      </div>
    </section>
  );
}
