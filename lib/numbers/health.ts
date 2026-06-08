export type NumberHealthTier = 'unknown' | 'healthy' | 'good' | 'watch' | 'at_risk' | 'critical';

export type NumberHealthSnapshot = {
  computed_health: number | null;
  reputation_score: number | null;
  health_label: string;
  health_tier: NumberHealthTier;
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

function labelFromTier(tier: NumberHealthTier, hasCalls: boolean, hasReputation: boolean): string {
  if (tier === 'unknown') {
    if (!hasCalls && !hasReputation) return 'New';
    if (hasCalls && !hasReputation) return 'Building data';
    return 'Not checked';
  }
  if (tier === 'healthy') return 'Healthy';
  if (tier === 'good') return 'Good';
  if (tier === 'watch') return 'Watch';
  if (tier === 'at_risk') return 'At risk';
  return 'Critical';
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

  if (!hasCalls && !hasReputation) {
    return {
      computed_health: null,
      reputation_score: null,
      health_label: 'New',
      health_tier: 'unknown',
      has_call_data: false,
      has_reputation_check: false,
    };
  }

  let health: number;

  if (reputation !== null) {
    health = reputation;
  } else {
    // Call activity only — neutral baseline until reputation is checked
    health = 65;
    if (input.connect_rate >= 25) health += 10;
    else if (input.connect_rate >= 15) health += 5;
    else if (input.connect_rate > 0 && input.connect_rate < 10) health -= 15;
    else if (hasCalls && input.connect_rate === 0) health -= 25;
  }

  if (spamStatus === 'low_risk') health -= 20;
  if (spamStatus === 'flagged') health -= 50;
  if (spamStatus === 'blocked') health = Math.min(health, 10);

  if (hasCalls && input.total_calls > 200) health -= 15;

  const computed = clampScore(health);
  const hasData = hasCalls || hasReputation;
  const tier = tierFromTier(computed, hasData, hasReputation, hasCalls);

  return {
    computed_health: computed,
    reputation_score: reputation,
    health_label: labelFromTier(tier, hasCalls, hasReputation),
    health_tier: tier,
    has_call_data: hasCalls,
    has_reputation_check: hasReputation,
  };
}

function tierFromTier(
  health: number,
  hasData: boolean,
  hasReputation: boolean,
  hasCalls: boolean,
): NumberHealthTier {
  const base = tierFromHealth(health, hasData);
  // Don't call a number "Healthy" on call stats alone without a reputation check
  if (base === 'healthy' && !hasReputation && hasCalls) return 'good';
  return base;
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

export const HEALTH_TIER_STYLES: Record<
  NumberHealthTier,
  { text: string; bar: string; badge: string }
> = {
  unknown: {
    text: 'text-slate-400',
    bar: 'bg-slate-600',
    badge: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  },
  healthy: {
    text: 'text-emerald-400',
    bar: 'bg-emerald-500',
    badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  },
  good: {
    text: 'text-cyan-400',
    bar: 'bg-cyan-500',
    badge: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  },
  watch: {
    text: 'text-amber-400',
    bar: 'bg-amber-500',
    badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  },
  at_risk: {
    text: 'text-orange-400',
    bar: 'bg-orange-500',
    badge: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  },
  critical: {
    text: 'text-red-400',
    bar: 'bg-red-500',
    badge: 'bg-red-500/10 text-red-400 border-red-500/20',
  },
};

export function healthScoreColor(health: number | null): string {
  if (health === null) return HEALTH_TIER_STYLES.unknown.text;
  if (health >= 80) return HEALTH_TIER_STYLES.healthy.text;
  if (health >= 60) return HEALTH_TIER_STYLES.good.text;
  if (health >= 40) return HEALTH_TIER_STYLES.watch.text;
  return HEALTH_TIER_STYLES.at_risk.text;
}

export function healthScoreBar(health: number | null): string {
  if (health === null) return HEALTH_TIER_STYLES.unknown.bar;
  if (health >= 80) return HEALTH_TIER_STYLES.healthy.bar;
  if (health >= 60) return HEALTH_TIER_STYLES.good.bar;
  if (health >= 40) return HEALTH_TIER_STYLES.watch.bar;
  return HEALTH_TIER_STYLES.at_risk.bar;
}

export function formatHealthPercent(health: number | null): string {
  return health === null ? '—' : `${health}%`;
}

export function formatReputationScore(reputation: number | null): string {
  return reputation === null ? 'Not checked' : `${reputation}/100`;
}
