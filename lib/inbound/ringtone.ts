import { getVoiceAudioContext } from '@/lib/voice/audio-unlock';

let ringInterval: ReturnType<typeof setInterval> | null = null;

export function playInboundRingtone() {
  try {
    if (typeof window === 'undefined') return;
    const audioCtx = getVoiceAudioContext();
    if (!audioCtx) return;

    stopInboundRingtone();
    void audioCtx.resume().catch(() => {});

    ringInterval = setInterval(() => {
      [480, 620].forEach((freq, i) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.frequency.value = freq;
        gain.gain.value = 0.09;
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        const start = audioCtx.currentTime + i * 0.1;
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
}
