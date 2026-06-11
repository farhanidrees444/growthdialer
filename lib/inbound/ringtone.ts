let audioCtx: AudioContext | null = null;
let ringInterval: ReturnType<typeof setInterval> | null = null;

export function playInboundRingtone() {
  try {
    if (typeof window === 'undefined') return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Ctx = AudioContext ?? (window as any).webkitAudioContext;
    if (!Ctx) return;

    stopInboundRingtone();
    audioCtx = new Ctx();
    ringInterval = setInterval(() => {
      if (!audioCtx) return;
      [480, 620].forEach((freq, i) => {
        const osc = audioCtx!.createOscillator();
        const gain = audioCtx!.createGain();
        osc.frequency.value = freq;
        gain.gain.value = 0.09;
        osc.connect(gain);
        gain.connect(audioCtx!.destination);
        const start = audioCtx!.currentTime + i * 0.1;
        osc.start(start);
        osc.stop(start + 0.4);
      });
    }, 1600);
  } catch {
    /* AudioContext unavailable */
  }
}

export function stopInboundRingtone() {
  if (ringInterval) {
    clearInterval(ringInterval);
    ringInterval = null;
  }
  if (audioCtx) {
    void audioCtx.close().catch(() => {});
    audioCtx = null;
  }
}
