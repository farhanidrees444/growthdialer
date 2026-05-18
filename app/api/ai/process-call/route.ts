import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import {
  groq, generateEmbedding,
  analyzeCallWithGemini, analyzeCallWithGroq,
} from '@/lib/ai/clients';
import { checkAIRateLimit } from '@/lib/ai/rate-limiter';

export const maxDuration = 120;

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-internal-secret');
  if (secret !== process.env.INTERNAL_API_SECRET) {
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

  console.log('[AI] Starting processing for call:', callId);
  const startedAt = Date.now();

  // ── Step 1: Fetch call + idempotency check ─────────────────────────────────
  const { data: call, error: callError } = await supabase
    .from('calls')
    .select('id, user_id, lead_id, recording_url, analytics_id, ai_processed')
    .eq('id', callId)
    .single();

  if (callError || !call) {
    console.error('[AI] Call not found:', callId, callError);
    return NextResponse.json({ error: 'Call not found' }, { status: 404 });
  }

  if (call.analytics_id || call.ai_processed) {
    console.log('[AI] Already processed — skipping:', callId);
    return NextResponse.json({ skipped: true, reason: 'already_processed' });
  }

  if (!call.recording_url) {
    console.warn('[AI] No recording URL for call:', callId);
    return NextResponse.json({ skipped: true, reason: 'no_recording' });
  }

  // Mark as in-progress to prevent duplicate runs
  await supabase
    .from('calls')
    .update({ ai_processed: true, ai_processed_at: new Date().toISOString() })
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
      console.log('[AI] Downloading recording:', call.recording_url);
      const audioRes = await fetch(call.recording_url, { signal: AbortSignal.timeout(30000) });
      if (!audioRes.ok) throw new Error(`Audio download failed: ${audioRes.status}`);

      const audioBuffer = await audioRes.arrayBuffer();
      const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' });
      const audioFile = new File([audioBlob], 'recording.mp3', { type: 'audio/mpeg' });

      const transcription = await groq.audio.transcriptions.create({
        file: audioFile,
        model: 'whisper-large-v3',
        response_format: 'verbose_json',
        timestamp_granularities: ['word'],
      });

      transcript = transcription.text ?? '';
      transcriptWords = (transcription as { words?: typeof transcriptWords }).words ?? [];
      console.log('[AI] Transcript length:', transcript.length, '| Words:', transcriptWords.length);

      // Save transcript to calls table immediately
      await supabase.from('calls').update({ transcript }).eq('id', callId);
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
    analysis = await analyzeCallWithGemini(transcript, companyName, industry, jobTitle, previousMemories);
    console.log('[AI] Gemini response:', JSON.stringify({
      sentiment: analysis.sentiment,
      sentiment_score: analysis.sentiment_score,
      suggested_disposition: analysis.suggested_disposition,
      memories_count: analysis.memories_to_save?.length ?? 0,
    }));
  } catch (geminiErr) {
    console.warn('[AI] Gemini failed, falling back to Groq Llama:', geminiErr);
    modelUsed = 'llama-3.3-70b-versatile';
    try {
      analysis = await analyzeCallWithGroq(transcript, companyName, industry, jobTitle, previousMemories);
    } catch (groqErr) {
      console.error('[AI] Both AI providers failed:', groqErr);
      await saveError(supabase, callId, call.user_id, call.lead_id, 'analysis_failed');
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

  console.log('[AI] Saved analytics:', analyticsInserted.id);

  // Link analytics back to call
  await supabase
    .from('calls')
    .update({ analytics_id: analyticsInserted.id })
    .eq('id', callId);

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
  await supabase.from('call_analytics').insert({
    call_id: callId,
    user_id: userId,
    lead_id: leadId,
    error: errorMsg,
  }).select('id').single().then(({ data }) => {
    if (data?.id) {
      supabase.from('calls').update({ analytics_id: data.id }).eq('id', callId);
    }
  });
}
