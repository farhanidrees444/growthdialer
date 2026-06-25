'use client';

import { useEffect, useState } from 'react';
import { Headset } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

type WhisperPayload = {
  call_id?: string | null;
  message?: string;
  sent_at?: string;
};

export function AgentWhisperListener({ callId }: { callId: string | null }) {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    let active = true;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    void (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!active || !user) return;

      channel = supabase
        .channel(`coaching:agent_${user.id}`)
        .on('broadcast', { event: 'whisper' }, ({ payload }) => {
          const whisper = payload as WhisperPayload;
          if (whisper.call_id && callId && whisper.call_id !== callId) return;
          if (whisper.message) {
            setMessage(whisper.message);
            window.setTimeout(() => setMessage(null), 15000);
          }
        })
        .subscribe();
    })();

    return () => {
      active = false;
      if (channel) void supabase.removeChannel(channel);
    };
  }, [callId]);

  if (!message) return null;

  return (
    <div className="mx-5 mb-3 rounded-2xl border border-[#8B5CF6]/30 bg-[#8B5CF6]/15 p-3 text-sm text-violet-50">
      <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-violet-200">
        <Headset className="h-3.5 w-3.5" />
        Coach whisper
      </div>
      {message}
    </div>
  );
}
