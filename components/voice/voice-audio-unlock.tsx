'use client';

import { useEffect } from 'react';
import { primeVoiceAudioOnUserGesture } from '@/lib/voice/audio-unlock';

/** Primes browser audio on first dashboard interaction (autoplay policy). */
export function VoiceAudioUnlock() {
  useEffect(() => {
    primeVoiceAudioOnUserGesture();
  }, []);
  return null;
}
