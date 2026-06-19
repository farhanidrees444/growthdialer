'use client';

import { useEffect, useState } from 'react';
import { useMarketingMotionReduced } from './motion';

const PHRASES = ['AI Sales Dialer', 'Conversation Intelligence', 'Revenue Engine'];

export function TypewriterRotator({ prefix = 'The ' }: { prefix?: string }) {
  const reduce = useMarketingMotionReduced();
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [text, setText] = useState(PHRASES[0]);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (reduce) return;
    const target = PHRASES[phraseIdx];
    const timeout = setTimeout(
      () => {
        if (!deleting) {
          if (text.length < target.length) {
            setText(target.slice(0, text.length + 1));
          } else {
            setTimeout(() => setDeleting(true), 1800);
          }
        } else if (text.length > 0) {
          setText(text.slice(0, -1));
        } else {
          setDeleting(false);
          setPhraseIdx((i) => (i + 1) % PHRASES.length);
        }
      },
      deleting ? 28 : 55
    );
    return () => clearTimeout(timeout);
  }, [text, deleting, phraseIdx, reduce]);

  if (reduce) {
    return (
      <p className="mt-4 text-[18px] text-zinc-400">
        {prefix}
        <span className="font-medium text-[#8B5CF6]">{PHRASES[0]}</span>
      </p>
    );
  }

  return (
    <p className="mt-4 min-h-[28px] text-[18px] text-zinc-400">
      {prefix}
      <span className="font-medium text-[#8B5CF6]">{text}</span>
      <span className="ml-0.5 inline-block h-[1.1em] w-[2px] animate-pulse bg-[#06B6D4]" />
    </p>
  );
}
