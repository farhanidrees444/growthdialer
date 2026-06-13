/**
 * Browser audio unlock for WebRTC inbound/outbound calls.
 * Modern autoplay policies require a user gesture before remote audio plays.
 */

let voiceAudioContext: AudioContext | null = null;
let primed = false;

export function getVoiceAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!voiceAudioContext) {
    const Ctx = window.AudioContext
      ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return null;
    voiceAudioContext = new Ctx();
  }
  return voiceAudioContext;
}

/** Resume suspended Web Audio context — call from Accept / dial user gestures. */
export async function resumeVoiceAudioContext(): Promise<void> {
  const ctx = getVoiceAudioContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') {
    await ctx.resume();
  }
  primed = true;
}

export function isVoiceAudioPrimed(): boolean {
  return primed;
}

/** Prime audio on first dashboard interaction so Accept is not blocked. */
export function primeVoiceAudioOnUserGesture(): void {
  if (typeof window === 'undefined' || primed) return;

  const prime = () => {
    void resumeVoiceAudioContext();
    window.removeEventListener('pointerdown', prime, true);
    window.removeEventListener('keydown', prime, true);
  };

  window.addEventListener('pointerdown', prime, { capture: true, once: true });
  window.addEventListener('keydown', prime, { capture: true, once: true });
}
