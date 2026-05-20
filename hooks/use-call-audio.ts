'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

const BAR_COUNT = 32;

export function useCallAudio(active: boolean) {
  const [bars, setBars] = useState<number[]>(Array(BAR_COUNT).fill(0));
  const animFrameRef = useRef<number>(0);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const idleFrameRef = useRef<number>(0);
  const idlePhaseRef = useRef(0);

  const startIdleWave = useCallback(() => {
    const animate = () => {
      idlePhaseRef.current += 0.04;
      const p = idlePhaseRef.current;
      const idleBars = Array.from({ length: BAR_COUNT }, (_, i) => {
        return Math.max(2, 8 * Math.abs(Math.sin(p + i * 0.4)));
      });
      setBars(idleBars);
      idleFrameRef.current = requestAnimationFrame(animate);
    };
    idleFrameRef.current = requestAnimationFrame(animate);
  }, []);

  const stopIdleWave = useCallback(() => {
    if (idleFrameRef.current) cancelAnimationFrame(idleFrameRef.current);
  }, []);

  useEffect(() => {
    if (!active) {
      stopIdleWave();
      cancelAnimationFrame(animFrameRef.current);
      setBars(Array(BAR_COUNT).fill(0));
      return;
    }

    const audioEl = document.getElementById('telnyx-remote-audio') as HTMLAudioElement | null;
    if (!audioEl) { startIdleWave(); return; }

    try {
      if (!ctxRef.current) {
        ctxRef.current = new AudioContext();
      }
      const ctx = ctxRef.current;

      if (!sourceRef.current) {
        sourceRef.current = ctx.createMediaElementSource(audioEl);
      }
      if (!analyserRef.current) {
        analyserRef.current = ctx.createAnalyser();
        analyserRef.current.fftSize = 64;
        sourceRef.current.connect(analyserRef.current);
        analyserRef.current.connect(ctx.destination);
      }

      const analyser = analyserRef.current;
      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const tick = () => {
        analyser.getByteFrequencyData(dataArray);
        const step = Math.floor(dataArray.length / BAR_COUNT);
        const newBars = Array.from({ length: BAR_COUNT }, (_, i) => {
          return (dataArray[i * step] / 255) * 80;
        });
        setBars(newBars);
        animFrameRef.current = requestAnimationFrame(tick);
      };
      animFrameRef.current = requestAnimationFrame(tick);
    } catch {
      startIdleWave();
    }

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      stopIdleWave();
    };
  }, [active, startIdleWave, stopIdleWave]);

  return { bars };
}
