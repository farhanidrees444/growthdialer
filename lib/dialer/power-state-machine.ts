/**
 * Canonical power-dial phases (Part 2 master prompt).
 * idle → dialing → connected → wrap_up → dialing … paused/ending as needed.
 */
export type PowerDialPhase =
  | 'idle'
  | 'dialing'
  | 'connected'
  | 'wrap_up'
  | 'paused'
  | 'ending';

const TRANSITIONS: Record<PowerDialPhase, PowerDialPhase[]> = {
  idle: ['dialing'],
  dialing: ['connected', 'paused', 'idle', 'ending'],
  connected: ['wrap_up', 'paused'],
  wrap_up: ['dialing', 'ending', 'paused'],
  paused: ['dialing', 'connected', 'wrap_up', 'idle'],
  ending: ['idle'],
};

export function canTransitionPowerPhase(from: PowerDialPhase, to: PowerDialPhase): boolean {
  if (from === to) return true;
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export function transitionPowerPhase(
  from: PowerDialPhase,
  to: PowerDialPhase,
): PowerDialPhase {
  if (!canTransitionPowerPhase(from, to)) {
    console.warn('[power-dial] invalid transition', from, '→', to);
    return from;
  }
  return to;
}

export function isPowerSessionActive(phase: PowerDialPhase): boolean {
  return phase !== 'idle' && phase !== 'ending';
}

export function isPowerBetweenCalls(phase: PowerDialPhase): boolean {
  return phase === 'dialing';
}
