export type WorkflowScene =
  | 'leads'
  | 'sequences'
  | 'numbers'
  | 'recordings'
  | 'calls'
  | 'analytics'
  | 'leaderboard'
  | 'dialer'
  | 'integrations'
  | 'generic';

export type SceneAccent = 'emerald' | 'violet' | 'cyan' | 'neutral' | 'amber';

export interface WorkflowSceneConfig {
  lottie: string;
  accent: SceneAccent;
  /** CSS gradient stops for the illustration halo */
  halo: string;
}

export const WORKFLOW_SCENES: Record<WorkflowScene, WorkflowSceneConfig> = {
  leads: {
    lottie: '/lottie/leads-audience.json',
    accent: 'violet',
    halo: 'from-violet-500/25 via-fuchsia-500/10 to-transparent',
  },
  sequences: {
    lottie: '/lottie/sequence-flow.json',
    accent: 'cyan',
    halo: 'from-cyan-500/20 via-violet-500/10 to-transparent',
  },
  numbers: {
    lottie: '/lottie/dial-pulse.json',
    accent: 'violet',
    halo: 'from-violet-500/30 via-indigo-500/10 to-transparent',
  },
  recordings: {
    lottie: '/lottie/recordings-wave.json',
    accent: 'emerald',
    halo: 'from-emerald-500/25 via-teal-500/10 to-transparent',
  },
  calls: {
    lottie: '/lottie/calls-pulse.json',
    accent: 'cyan',
    halo: 'from-cyan-500/22 via-sky-500/8 to-transparent',
  },
  analytics: {
    lottie: '/lottie/analytics-line.json',
    accent: 'violet',
    halo: 'from-violet-500/20 via-blue-500/10 to-transparent',
  },
  leaderboard: {
    lottie: '/lottie/leaderboard-bars.json',
    accent: 'amber',
    halo: 'from-amber-500/22 via-orange-500/8 to-transparent',
  },
  dialer: {
    lottie: '/lottie/dial-pulse.json',
    accent: 'violet',
    halo: 'from-violet-500/28 via-purple-500/12 to-transparent',
  },
  integrations: {
    lottie: '/lottie/sequence-flow.json',
    accent: 'cyan',
    halo: 'from-cyan-500/18 via-violet-500/8 to-transparent',
  },
  generic: {
    lottie: '/lottie/dial-pulse.json',
    accent: 'neutral',
    halo: 'from-zinc-400/15 via-zinc-500/5 to-transparent',
  },
};

export function resolveSceneConfig(
  scene?: WorkflowScene,
  accent?: SceneAccent,
): WorkflowSceneConfig {
  const base = WORKFLOW_SCENES[scene ?? 'generic'];
  if (!accent || accent === base.accent) return base;
  return { ...base, accent };
}
