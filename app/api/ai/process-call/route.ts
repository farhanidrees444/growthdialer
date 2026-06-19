import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import {
  groq, generateEmbedding,
  analyzeCallWithGemini, analyzeCallWithGroq,
} from '@/lib/ai/clients';
import { checkAIRateLimit } from '@/lib/ai/rate-limiter';
import { shouldSkipAiProcessing } from '@/lib/ai/pipeline-status';
import {
  downloadRecordingAudio,
  downloadRecordingFromStorage,
} from '@/lib/recordings/storage';
import { isPlayableRecordingDuration } from '@/lib/recordings/eligibility';

export const maxDuration = 120;

export async function POST(request: NextRequest) {
  // SECURITY: must come from our own webhook with a real shared secret.
  // Previously, if INTERNAL_API_SECRET was unset both sides became
  // undefined and the comparison passed (`undefined === undefined`).
  const expected = process.env.INTERNAL_API_SECRET?.trim();
  if (!expected) {
    console.error('[AI] INTERNAL_API_SECRET is not configured — refusing to process');
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 503 });
  }
  const secret = request.headers.get('x-internal-secret');
  if (secret !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServiceClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Service client unavailable' }, { status: 503 });
  }

  let callId: string | undefined;
  try {
    const body = await request.json();
    callId = body.call_id as string;
    if (!callId) return NextResponse.json({ error: 'call_id required' }, { status: 400 });
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  console.log('[AI-0] keys present: GROQ:', !!process.env.GROQ_API_KEY, '| GEMINI:', !!process.env.GEMINI_API_KEY, '| INTERNAL_SECRET:', !!process.env.INTERNAL_API_SECRET);
  console.log('[AI-1] Process started for call:', callId);
  const startedAt = Date.now();

  // ── Step 1: Fetch call + idempotency check ─────────────────────────────────
  let call: {
    id: string;
    user_id: string;
    lead_id: string | null;
    recording_url: string | null;
    recording_supabase_path?: string | null;
    duration_seconds?: number | null;
    recording_duration_seconds?: number | null;
    analytics_id?: string | null;
    ai_processed?: boolean | null;
    ai_processing_status?: string | null;
    ai_processed_at?: string | null;
  } | null = null;

  const fullSelect =
    'id, user_id, lead_id, recording_url, recording_supabase_path, duration_seconds, recording_duration_seconds, analytics_id, ai_processed, ai_processing_status, ai_processed_at';
  const { data: callFull, error: callError } = await supabase
    .from('calls')
    .select(fullSelect)
    .eq('id', callId)
    .single();

  if (callError?.code === '42703' || callError?.message?.includes('analytics_id')) {
    console.warn('[AI] analytics_id column missing — retrying select without it. Run migration 033.');
    const { data: callLite, error: liteErr } = await supabase
      .from('calls')
      .select('id, user_id, lead_id, recording_url, recording_supabase_path, duration_seconds, recording_duration_seconds, ai_processed, ai_processing_status, ai_processed_at')
      .eq('id', callId)
      .single();
    if (liteErr || !callLite) {
      console.error('[AI] Call not found:', callId, liteErr);
      return NextResponse.json({ error: 'Call not found' }, { status: 404 });
    }
    call = callLite;
  } else if (callError || !callFull) {
    console.error('[AI] Call not found:', callId, callError);
    return NextResponse.json({ error: 'Call not found' }, { status: 404 });
  } else {
    call = callFull;
  }

  const skip = shouldSkipAiProcessing(call);
  if (skip.skip) {
    console.log('[AI] Skipping call:', callId, '| reason:', skip.reason);
    return NextResponse.json({ skipped: true, reason: skip.reason });
  }

  if (!call.recording_url) {
    console.warn('[AI] No recording URL for call:', callId);
    return NextResponse.json({ skipped: true, reason: 'no_recording' });
  }

  const recordingDuration = call.recording_duration_seconds ?? call.duration_seconds;
  if (!isPlayableRecordingDuration(recordingDuration)) {
    console.log('[AI] Skipping short recording:', callId, '| duration:', recordingDuration);
    await supabase
      .from('calls')
      .update({ ai_processing_status: 'skipped_short', ai_error: null })
      .eq('id', callId);
    return NextResponse.json({ skipped: true, reason: 'short_recording' });
  }

  // Mark as in-progress to prevent duplicate runs.
  // IMPORTANT: do NOT set ai_processed=true here — if transcription / analysis
  // later throws, the row would be permanently flagged as done and never
  // retry-able. ai_processed flips to true ONLY at the very end (after the
  // call_analytics insert succeeds).
  await supabase
    .from('calls')
    .update({
      ai_processing_status: 'processing',
      ai_processed_at: new Date().toISOString(),
    })
    .eq('id', callId);

  // ── Step 2: Fetch user settings ────────────────────────────────────────────
  const { data: settings } = await supabase
    .from('user_settings')
    .select('ai_auto_transcribe, ai_auto_summarize, ai_detect_sentiment, ai_extract_talking_points')
    .eq('user_id', call.user_id)
    .single();

  const doTranscribe = settings?.ai_auto_transcribe ?? true;
  const doSummarize = settings?.ai_auto_summarize ?? true;
  const doSentiment = settings?.ai_detect_sentiment ?? true;
  const doTalkingPoints = settings?.ai_extract_talking_points ?? true;

  console.log('[AI] Settings — transcribe:', doTranscribe, 'summarize:', doSummarize, 'sentiment:', doSentiment, 'talking_points:', doTalkingPoints);

  // ── Step 3: Rate limit ─────────────────────────────────────────────────────
  const { allowed, used, limit } = await checkAIRateLimit(call.user_id);
  if (!allowed) {
    console.warn(`[AI] Rate limit hit for user ${call.user_id} (${used}/${limit})`);
    await saveError(supabase, callId, call.user_id, call.lead_id, 'rate_limit_exceeded');
    return NextResponse.json({ skipped: true, reason: 'rate_limit_exceeded' });
  }

  // ── Step 4: Fetch lead context ─────────────────────────────────────────────
  let companyName = 'Unknown';
  let industry = 'Unknown';
  let jobTitle = 'Unknown';

  if (call.lead_id) {
    const { data: lead } = await supabase
      .from('leads')
      .select('name, company, industry, job_title')
      .eq('id', call.lead_id)
      .single();
    if (lead) {
      companyName = lead.company ?? 'Unknown';
      industry = (lead as { industry?: string }).industry ?? 'Unknown';
      jobTitle = (lead as { job_title?: string }).job_title ?? 'Unknown';
    }
  }

  // ── Step 5: Fetch previous lead memories ──────────────────────────────────
  let previousMemories = '';
  if (call.lead_id) {
    const { data: memories } = await supabase
      .from('lead_memory')
      .select('memory_type, content, created_at')
      .eq('lead_id', call.lead_id)
      .order('importance_score', { ascending: false })
      .limit(5);

    if (memories && memories.length > 0) {
      previousMemories = memories.map((m) => `[${m.memory_type}] ${m.content}`).join('\n');
    }
  }

  // ── Step 6: Transcription (conditional) ────────────────────────────────────
  let transcript = '';
  let transcriptWords: Array<{ word: string; start: number; end: number }> = [];

  if (doTranscribe) {
    try {
      let audioBuffer: ArrayBuffer;
      if (call.recording_supabase_path) {
        console.log('[AI-2] Downloading recording from storage:', call.recording_supabase_path);
        const stored = await downloadRecordingFromStorage(supabase, call.recording_supabase_path);
        audioBuffer = stored.buffer;
      } else {
        console.log('[AI-2] Downloading recording from URL:', call.recording_url);
        const remote = await downloadRecordingAudio(call.recording_url);
        audioBuffer = remote.buffer;
      }
      console.log('[AI-2] Recording downloaded | bytes:', audioBuffer.byteLength);
      const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' });
      const audioFile = new File([audioBlob], 'recording.mp3', { type: 'audio/mpeg' });

      console.log('[AI-2] Audio bytes:', audioBuffer.byteLength, '— sending to Whisper');
      if (audioBuffer.byteLength === 0) {
        throw new Error('Downloaded audio is 0 bytes — recording URL may be invalid or expired');
      }

      const transcription = await groq.audio.transcriptions.create({
        file: audioFile,
        model: 'whisper-large-v3',
        response_format: 'verbose_json',
        timestamp_granularities: ['word'],
      });

      transcript = transcription.text ?? '';
      transcriptWords = (transcription as { words?: typeof transcriptWords }).words ?? [];
      console.log('[AI-3] Whisper complete — transcript length:', transcript.length, 'chars | words:', transcriptWords.length);

      // Save transcript to calls table immediately so it shows even if AI analysis fails
      await supabase.from('calls').update({ transcript }).eq('id', callId);
      console.log('[AI-4] Transcript saved to calls table');
    } catch (err) {
      console.error('[AI] Transcription failed:', err);
      await saveError(supabase, callId, call.user_id, call.lead_id, `transcription_failed: ${String(err)}`);
      return NextResponse.json({ error: 'Transcription failed' }, { status: 500 });
    }

    if (!transcript.trim()) {
      await saveError(supabase, callId, call.user_id, call.lead_id, 'empty_transcript');
      return NextResponse.json({ skipped: true, reason: 'empty_transcript' });
    }
  } else {
    console.log('[AI] Transcription disabled by user settings');
    return NextResponse.json({ skipped: true, reason: 'transcription_disabled' });
  }

  // ── Step 7: Transcript embedding ───────────────────────────────────────────
  const transcriptEmbedding = await generateEmbedding(transcript);

  // ── Step 8: AI analysis (conditional) ─────────────────────────────────────
  if (!doSummarize && !doSentiment && !doTalkingPoints) {
    console.log('[AI] All analysis settings disabled — saving transcript only');
    return NextResponse.json({ success: true, transcript_only: true });
  }

  let analysis;
  let modelUsed = 'gemini-2.0-flash';

  try {
    console.log('[AI-5] Sending to Gemini for analysis…');
    analysis = await analyzeCallWithGemini(transcript, companyName, industry, jobTitle, previousMemories);
    console.log('[AI-5] Gemini complete — sentiment:', analysis.sentiment, '| score:', analysis.sentiment_score, '| disposition:', analysis.suggested_disposition, '| memories:', analysis.memories_to_save?.length ?? 0);
  } catch (geminiErr) {
    console.warn('[AI-5] Gemini failed:', String(geminiErr).slice(0, 300), '— trying Groq fallback');
    modelUsed = 'llama-3.3-70b-versatile';
    try {
      analysis = await analyzeCallWithGroq(transcript, companyName, industry, jobTitle, previousMemories);
      console.log('[AI-5] Groq fallback complete — sentiment:', analysis.sentiment);
    } catch (groqErr) {
      console.error('[AI-5] Both AI engines failed:', String(groqErr).slice(0, 300));
      await saveError(supabase, callId, call.user_id, call.lead_id, `analysis_failed: ${String(groqErr).slice(0, 200)}`);
      return NextResponse.json({ error: 'Analysis failed' }, { status: 500 });
    }
  }

  // ── Step 9: Save call_analytics ────────────────────────────────────────────
  const processingMs = Date.now() - startedAt;
  const analyticsRow: Record<string, unknown> = {
    call_id: callId,
    user_id: call.user_id,
    lead_id: call.lead_id ?? null,
    transcript,
    ai_model_used: modelUsed,
    processing_time_ms: processingMs,
  };

  // Only include analysis fields that were requested
  if (doSummarize) {
    analyticsRow.summary = transcriptWords.length > 0
      ? { bullets: analysis.summary, words: transcriptWords }
      : analysis.summary;
    analyticsRow.next_steps = analysis.next_steps;
    analyticsRow.suggested_disposition = analysis.suggested_disposition;
    analyticsRow.buying_signals = analysis.buying_signals;
    analyticsRow.objections = analysis.objections;
  }
  if (doSentiment) {
    analyticsRow.sentiment = analysis.sentiment;
    analyticsRow.sentiment_score = analysis.sentiment_score;
  }
  if (doTalkingPoints) {
    analyticsRow.talking_points = analysis.talking_points;
  }
  if (transcriptEmbedding) {
    analyticsRow.transcript_embedding = JSON.stringify(transcriptEmbedding);
  }

  const { data: analyticsInserted, error: insertErr } = await supabase
    .from('call_analytics')
    .insert(analyticsRow)
    .select('id')
    .single();

  if (insertErr || !analyticsInserted) {
    console.error('[AI] Analytics insert failed:', insertErr);
    return NextResponse.json({ error: 'Save failed' }, { status: 500 });
  }

  console.log('[AI-5] Saved analytics row:', analyticsInserted.id);

  // Write key AI results directly to calls table so the recordings list can
  // read them without a separate call_analytics join.
  // ai_processed flips to true HERE — only after the analytics row has been
  // successfully inserted. This makes the whole pipeline retry-safe.
  const callsAiUpdate: Record<string, unknown> = {
    analytics_id: analyticsInserted.id,
    ai_processed: true,
    ai_processing_status: 'completed',
  };
  if (doSummarize) {
    callsAiUpdate.ai_summary = analysis.summary;
    callsAiUpdate.ai_next_steps = analysis.next_steps;
    callsAiUpdate.ai_objections = analysis.objections;
  }
  if (doSentiment) {
    callsAiUpdate.ai_sentiment = analysis.sentiment;
    callsAiUpdate.ai_sentiment_score = analysis.sentiment_score;
  }
  if (doTalkingPoints) {
    callsAiUpdate.ai_keywords = analysis.talking_points;
  }

  const { error: callUpdateErr } = await supabase
    .from('calls')
    .update(callsAiUpdate)
    .eq('id', callId);

  if (callUpdateErr) {
    console.warn('[AI-5] calls table AI update failed (may be missing columns):', callUpdateErr.message);
    // Non-fatal: analytics_id is set separately below
    await supabase
      .from('calls')
      .update({ analytics_id: analyticsInserted.id, ai_processing_status: 'completed' })
      .eq('id', callId);
  } else {
    console.log('[AI-5] AI results written to calls table');
  }

  // ── Step 10: Save lead memories ────────────────────────────────────────────
  if (call.lead_id && analysis.memories_to_save?.length > 0) {
    const memoryInserts = await Promise.allSettled(
      analysis.memories_to_save.map(async (mem) => {
        const embedding = await generateEmbedding(mem.content);
        const row: Record<string, unknown> = {
          lead_id: call.lead_id,
          user_id: call.user_id,
          memory_type: mem.type,
          content: mem.content,
          importance_score: mem.importance ?? 0.5,
          source_call_id: callId,
        };
        if (embedding) row.content_embedding = JSON.stringify(embedding);
        return supabase.from('lead_memory').insert(row);
      }),
    );
    const failed = memoryInserts.filter((r) => r.status === 'rejected').length;
    if (failed > 0) console.warn(`[AI] ${failed} memory inserts failed`);
  }

  console.log(`[AI] Completed call ${callId} in ${processingMs}ms using ${modelUsed}`);
  return NextResponse.json({
    success: true,
    analytics_id: analyticsInserted.id,
    model: modelUsed,
    processing_ms: processingMs,
    memories_saved: analysis.memories_to_save?.length ?? 0,
  });
}

async function saveError(
  supabase: ReturnType<typeof createServiceClient>,
  callId: string,
  userId: string,
  leadId: string | null,
  errorMsg: string,
) {
  if (!supabase) return;
  console.error('[AI] Saving error for call', callId, ':', errorMsg);
  // Write ai_error to calls table immediately for observability
  await supabase
    .from('calls')
    .update({ ai_processing_status: 'failed', ai_error: errorMsg.slice(0, 500) })
    .eq('id', callId);
  // Also insert a minimal call_analytics row so errors are queryable
  await supabase.from('call_analytics').insert({
    call_id: callId,
    user_id: userId,
    lead_id: leadId,
    error: errorMsg.slice(0, 500),
  }).select('id').single().then(({ data }) => {
    if (data?.id) {
      supabase.from('calls').update({ analytics_id: data.id }).eq('id', callId);
    }
  });
}
