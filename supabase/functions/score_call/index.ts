// @ts-nocheck
import { createServiceClient, geminiJson, json, requireInternalAuth, transcribeWithGroq } from '../_shared/coaching.ts';

type ScorePayload = {
  opener_strength: number;
  discovery_depth: number;
  objection_handling: number;
  value_articulation: number;
  close_attempt: number;
  ai_summary: string;
  key_moments: Array<{ timestamp?: string; title: string; detail: string }>;
  coachable_moments: Array<{ title: string; detail: string; suggested_script: string }>;
};

const RUBRIC_KEYS = ['opener_strength', 'discovery_depth', 'objection_handling', 'value_articulation', 'close_attempt'] as const;

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  const authError = await requireInternalAuth(req);
  if (authError) return authError;

  try {
    const { call_id } = await req.json() as { call_id?: string };
    if (!call_id) return json({ error: 'call_id required' }, 400);

    const supabase = createServiceClient();
    const { data: call, error } = await supabase
      .from('calls')
      .select('id, user_id, workspace_id, transcript, recording_url, recording_supabase_path')
      .eq('id', call_id)
      .maybeSingle();

    if (error || !call) return json({ error: 'Call not found' }, 404);
    if (!call.workspace_id || !call.user_id) return json({ error: 'Call is missing workspace or agent' }, 400);

    let transcript = String(call.transcript ?? '').trim();
    let transcriptSource = transcript ? 'calls.transcript' : 'groq_whisper';
    if (!transcript) {
      if (!call.recording_url) return json({ error: 'No transcript or recording available' }, 400);
      transcript = await transcribeWithGroq(call.recording_url);
      if (!transcript) return json({ error: 'Empty transcript' }, 400);
      await supabase.from('calls').update({ transcript }).eq('id', call_id);
    }

    const score = await geminiJson<ScorePayload>(`Score this sales call transcript for GrowthDialer coaching.
Return only JSON with numeric scores from 0-20 for:
opener_strength, discovery_depth, objection_handling, value_articulation, close_attempt.
Also include ai_summary, key_moments array, and coachable_moments array with suggested_script.

Transcript:
${transcript.slice(0, 24000)}`);

    const rubric: Record<string, number> = {};
    let total = 0;
    for (const key of RUBRIC_KEYS) {
      const value = Math.max(0, Math.min(20, Number(score[key] ?? 0)));
      rubric[key] = value;
      total += value;
    }

    const { data: saved, error: upsertError } = await supabase
      .from('call_scores')
      .upsert({
        call_id,
        workspace_id: call.workspace_id,
        agent_id: call.user_id,
        total_score: Math.round(total),
        rubric_breakdown: rubric,
        ai_summary: score.ai_summary ?? '',
        key_moments: Array.isArray(score.key_moments) ? score.key_moments : [],
        coachable_moments: Array.isArray(score.coachable_moments) ? score.coachable_moments : [],
        model: 'gemini-2.5-flash',
        transcript_source: transcriptSource,
        scored_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'call_id' })
      .select()
      .single();

    if (upsertError) throw upsertError;
    return json({ ok: true, score: saved });
  } catch (err) {
    console.error('[score_call]', err);
    return json({ error: err instanceof Error ? err.message : 'Failed to score call' }, 500);
  }
});
