export type NumberHealthTier = 'unknown' | 'healthy' | 'good' | 'watch' | 'at_risk' | 'critical';

export type NumberHealthAction = 'none' | 'run_spam_check' | 'monitor' | 'review_connect_rate' | 'urgent';

/** User-facing status — calm by default, alarm only on confirmed carrier flags. */
export type PresentationTier =
  | 'ready'
  | 'active'
  | 'monitoring'
  | 'needs_check'
  | 'watch'
  | 'flagged'
  | 'blocked';

export type NumberHealthSnapshot = {
  computed_health: number | null;
  reputation_score: number | null;
  health_label: string;
  health_tier: NumberHealthTier;
  presentation_label: string;
  presentation_tier: PresentationTier;
  needs_attention: boolean;
  health_insight: string;
  action_required: NumberHealthAction;
  has_call_data: boolean;
  has_reputation_check: boolean;
};

type ComputeInput = {
  spam_status: string | null;
  spam_score: number | null;
  last_spam_check: string | null;
  total_calls: number;
  connect_rate: number;
};

/** Minimum outbound calls before connect-rate affects internal scoring. */
export const MIN_CALLS_FOR_CONNECT_SCORING = 10;

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function tierFromHealth(health: number | null, hasData: boolean): NumberHealthTier {
  if (!hasData || health === null) return 'unknown';
  if (health >= 80) return 'healthy';
  if (health >= 60) return 'good';
  if (health >= 40) return 'watch';
  if (health >= 20) return 'at_risk';
  return 'critical';
}

function resolveTier(
  health: number,
  hasData: boolean,
  hasReputation: boolean,
  hasCalls: boolean,
  totalCalls: number,
): NumberHealthTier {
  const base = tierFromHealth(health, hasData);
  if (base === 'healthy' && !hasReputation && hasCalls) return 'good';
  if (hasCalls && !hasReputation && totalCalls < MIN_CALLS_FOR_CONNECT_SCORING) {
    if (base === 'critical' || base === 'at_risk') return 'unknown';
  }
  return base;
}

function resolvePresentation(input: {
  spam_status: string;
  hasCalls: boolean;
  hasReputation: boolean;
  total_calls: number;
  reputation: number | null;
  internal_tier: NumberHealthTier;
}): Pick<NumberHealthSnapshot, 'presentation_label' | 'presentation_tier' | 'needs_attention'> {
  const { spam_status, hasCalls, hasReputation, total_calls, reputation, internal_tier } = input;

  if (spam_status === 'blocked') {
    return { presentation_label: 'Blocked', presentation_tier: 'blocked', needs_attention: true };
  }
  if (spam_status === 'flagged') {
    return { presentation_label: 'Flagged', presentation_tier: 'flagged', needs_attention: true };
  }

  if (!hasCalls && !hasReputation) {
    return { presentation_label: 'Ready', presentation_tier: 'ready', needs_attention: false };
  }

  if (!hasReputation) {
    if (hasCalls && total_calls < MIN_CALLS_FOR_CONNECT_SCORING) {
      return { presentation_label: 'Monitoring', presentation_tier: 'monitoring', needs_attention: false };
    }
    return { presentation_label: 'Needs check', presentation_tier: 'needs_check', needs_attention: false };
  }

  if (reputation !== null && reputation >= 70) {
    return { presentation_label: 'Active', presentation_tier: 'active', needs_attention: false };
  }

  if (spam_status === 'low_risk' || (reputation !== null && reputation >= 40)) {
    return { presentation_label: 'Watch', presentation_tier: 'watch', needs_attention: false };
  }

  if (reputation !== null && reputation < 40) {
    return { presentation_label: 'Watch', presentation_tier: 'watch', needs_attention: false };
  }

  if (internal_tier === 'watch') {
    return { presentation_label: 'Watch', presentation_tier: 'watch', needs_attention: false };
  }

  return { presentation_label: 'Active', presentation_tier: 'active', needs_attention: false };
}

function buildInsight(input: {
  presentation_tier: PresentationTier;
  hasCalls: boolean;
  hasReputation: boolean;
  total_calls: number;
  connect_rate: number;
  spam_status: string;
}): string {
  const { presentation_tier, hasCalls, hasReputation, total_calls, connect_rate, spam_status } = input;

  if (presentation_tier === 'blocked') {
    return 'This line is on a block list. Pause outbound use until it is cleared.';
  }
  if (presentation_tier === 'flagged') {
    return 'Carriers may label this caller ID. Consider rotating to another line.';
  }
  if (presentation_tier === 'ready') {
    return 'Your line is active. Run a deliverability check when you start dialing.';
  }
  if (presentation_tier === 'monitoring') {
    return `Building a baseline (${total_calls} call${total_calls === 1 ? '' : 's'} so far). We monitor automatically as volume grows.`;
  }
  if (presentation_tier === 'needs_check') {
    return hasCalls
      ? 'Run a deliverability check to see how carriers display this caller ID.'
      : 'Run a deliverability check before your first outbound calls.';
  }
  if (presentation_tier === 'watch' && hasReputation) {
    return 'Reputation is mixed. Spread volume across lines and recheck weekly.';
  }
  if (hasCalls && connect_rate === 0 && total_calls >= MIN_CALLS_FOR_CONNECT_SCORING) {
    return `${total_calls} dials with no connects in 30 days — try rotating caller IDs or refreshing your list.`;
  }
  if (spam_status === 'low_risk') {
    return 'Light spam signals detected. Keep volume moderate and rotate lines.';
  }
  return 'Line is healthy. GrowthDialer monitors reputation and rotates automatically.';
}

/** Carrier reputation from spam check (higher = better). Null until a check has run. */
export function reputationFromSpam(spam_score: number | null, last_spam_check: string | null): number | null {
  if (!last_spam_check) return null;
  return clampScore(100 - (spam_score ?? 0));
}

export function computeNumberHealth(input: ComputeInput): NumberHealthSnapshot {
  const spamStatus = input.spam_status ?? 'clean';
  const hasCalls = input.total_calls > 0;
  const hasReputation = Boolean(input.last_spam_check);
  const reputation = reputationFromSpam(input.spam_score, input.last_spam_check);
  const lowSample = hasCalls && input.total_calls < MIN_CALLS_FOR_CONNECT_SCORING;

  let health: number | null = null;
  let action: NumberHealthAction = 'none';
  let internalTier: NumberHealthTier = 'unknown';

  if (!hasCalls && !hasReputation) {
    const presentation = resolvePresentation({
      spam_status: spamStatus,
      hasCalls: false,
      hasReputation: false,
      total_calls: 0,
      reputation: null,
      internal_tier: 'unknown',
    });
    return {
      computed_health: null,
      reputation_score: null,
      health_label: presentation.presentation_label,
      health_tier: 'unknown',
      ...presentation,
      health_insight: buildInsight({
        presentation_tier: presentation.presentation_tier,
        hasCalls: false,
        hasReputation: false,
        total_calls: 0,
        connect_rate: 0,
        spam_status: spamStatus,
      }),
      action_required: 'run_spam_check',
      has_call_data: false,
      has_reputation_check: false,
    };
  }

  if (reputation !== null) {
    health = reputation;
  } else if (lowSample) {
    health = null;
    action = 'monitor';
  } else {
    health = 65;
    if (input.connect_rate >= 25) health += 10;
    else if (input.connect_rate >= 15) health += 5;
    else if (input.connect_rate > 0 && input.connect_rate < 10) health -= 15;
    else if (hasCalls && input.connect_rate === 0) {
      health -= 25;
      action = 'review_connect_rate';
    }
  }

  if (health !== null) {
    if (spamStatus === 'low_risk') health -= 20;
    if (spamStatus === 'flagged') {
      health -= 50;
      action = 'urgent';
    }
    if (spamStatus === 'blocked') {
      health = Math.min(health, 10);
      action = 'urgent';
    }
    if (hasCalls && input.total_calls > 200) health -= 15;
    health = clampScore(health);
  }

  if (!hasReputation && hasCalls && action === 'none') action = 'run_spam_check';

  const hasData = hasCalls || hasReputation;
  internalTier = health !== null
    ? resolveTier(health, hasData, hasReputation, hasCalls, input.total_calls)
    : 'unknown';

  const presentation = resolvePresentation({
    spam_status: spamStatus,
    hasCalls,
    hasReputation,
    total_calls: input.total_calls,
    reputation,
    internal_tier: internalTier,
  });

  return {
    computed_health: hasReputation ? health : null,
    reputation_score: reputation,
    health_label: presentation.presentation_label,
    health_tier: internalTier,
    ...presentation,
    health_insight: buildInsight({
      presentation_tier: presentation.presentation_tier,
      hasCalls,
      hasReputation,
      total_calls: input.total_calls,
      connect_rate: input.connect_rate,
      spam_status: spamStatus,
    }),
    action_required: action,
    has_call_data: hasCalls,
    has_reputation_check: hasReputation,
  };
}

export function isConfirmedIssue(num: {
  spam_status?: string | null;
  needs_attention?: boolean;
}): boolean {
  if (num.needs_attention) return true;
  const s = num.spam_status ?? 'clean';
  return s === 'flagged' || s === 'blocked';
}

export function averageComputedHealth(
  items: Array<{ computed_health?: number | null }>,
): number | null {
  const scored = items
    .map((n) => n.computed_health)
    .filter((h): h is number => typeof h === 'number');
  if (!scored.length) return null;
  return Math.round(scored.reduce((s, h) => s + h, 0) / scored.length);
}

export const PRESENTATION_STYLES: Record<
  PresentationTier,
  { text: string; badge: string; dot: string; ring: string }
> = {
  ready: {
    text: 'text-slate-400',
    badge: 'bg-slate-500/10 text-slate-300 border-slate-500/20',
    dot: 'bg-slate-500',
    ring: 'stroke-slate-600',
  },
  active: {
    text: 'text-emerald-400',
    badge: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
    dot: 'bg-emerald-500',
    ring: 'stroke-emerald-500/80',
  },
  monitoring: {
    text: 'text-cyan-400',
    badge: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20',
    dot: 'bg-cyan-500',
    ring: 'stroke-cyan-500/60',
  },
  needs_check: {
    text: 'text-violet-300',
    badge: 'bg-violet-500/10 text-violet-300 border-violet-500/25',
    dot: 'bg-violet-500',
    ring: 'stroke-violet-500/50',
  },
  watch: {
    text: 'text-amber-400',
    badge: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
    dot: 'bg-amber-400',
    ring: 'stroke-amber-400/70',
  },
  flagged: {
    text: 'text-orange-400',
    badge: 'bg-orange-500/10 text-orange-300 border-orange-500/25',
    dot: 'bg-orange-500',
    ring: 'stroke-orange-500',
  },
  blocked: {
    text: 'text-red-400',
    badge: 'bg-red-500/10 text-red-300 border-red-500/25',
    dot: 'bg-red-500',
    ring: 'stroke-red-500',
  },
};

export const HEALTH_TIER_STYLES: Record<
  NumberHealthTier,
  { text: string; bar: string; badge: string; ring: string }
> = {
  unknown: {
    text: 'text-slate-400',
    bar: 'bg-slate-600',
    badge: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    ring: 'stroke-slate-600',
  },
  healthy: {
    text: 'text-emerald-400',
    bar: 'bg-emerald-500',
    badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    ring: 'stroke-emerald-500',
  },
  good: {
    text: 'text-cyan-400',
    bar: 'bg-cyan-500',
    badge: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    ring: 'stroke-cyan-500',
  },
  watch: {
    text: 'text-amber-400',
    bar: 'bg-amber-500',
    badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    ring: 'stroke-amber-400',
  },
  at_risk: {
    text: 'text-orange-400',
    bar: 'bg-orange-500',
    badge: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    ring: 'stroke-orange-500',
  },
  critical: {
    text: 'text-red-400',
    bar: 'bg-red-500',
    badge: 'bg-red-500/10 text-red-400 border-red-500/20',
    ring: 'stroke-red-500',
  },
};

export function healthScoreColor(health: number | null): string {
  if (health === null) return PRESENTATION_STYLES.ready.text;
  if (health >= 80) return PRESENTATION_STYLES.active.text;
  if (health >= 60) return PRESENTATION_STYLES.monitoring.text;
  if (health >= 40) return PRESENTATION_STYLES.watch.text;
  return PRESENTATION_STYLES.flagged.text;
}

export function healthScoreBar(health: number | null): string {
  if (health === null) return 'bg-slate-600';
  if (health >= 80) return 'bg-emerald-500';
  if (health >= 60) return 'bg-cyan-500';
  if (health >= 40) return 'bg-amber-500';
  return 'bg-orange-500';
}

export function formatHealthPercent(health: number | null): string {
  return health === null ? '—' : `${health}%`;
}

export function formatReputationScore(reputation: number | null, checked: boolean): string {
  if (!checked) return '—';
  return reputation === null ? '—' : `${reputation}`;
}

export function sortNumbersByPriority<
  T extends {
    is_default?: boolean;
    needs_attention?: boolean;
    presentation_tier?: PresentationTier;
    action_required?: NumberHealthAction;
  },
>(items: T[]): T[] {
  const attentionWeight: Record<PresentationTier, number> = {
    blocked: 0,
    flagged: 1,
    watch: 2,
    needs_check: 3,
    monitoring: 4,
    ready: 5,
    active: 6,
  };
  const actionWeight: Record<NumberHealthAction, number> = {
    urgent: 0,
    review_connect_rate: 1,
    run_spam_check: 2,
    monitor: 3,
    none: 4,
  };

  return [...items].sort((a, b) => {
    if (a.is_default !== b.is_default) return a.is_default ? -1 : 1;
    if (a.needs_attention !== b.needs_attention) return a.needs_attention ? -1 : 1;
    const pw = attentionWeight[a.presentation_tier ?? 'active'] - attentionWeight[b.presentation_tier ?? 'active'];
    if (pw !== 0) return pw;
    const aw = actionWeight[a.action_required ?? 'none'] - actionWeight[b.action_required ?? 'none'];
    if (aw !== 0) return aw;
    return 0;
  });
}
