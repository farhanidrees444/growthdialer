import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import {
  groq, generateEmbedding,
  analyzeCallWithGemini, analyzeCallWithGroq,
} from '@/lib/ai/clients';
import { checkAIRateLimit } from '@/lib/ai/rate-limiter';

export const maxDuration = 120;

export async function POST(request: NextRequest) {
  // Verify internal secret
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

  const startedAt = Date.now();

  // ── Step 1: Fetch call + lead data ─────────────────────────────────────────
  const { data: call, error: callError } = await supabase
    .from('calls')
    .select('id, user_id, lead_id, recording_url, analytics_id')
    .eq('id', callId)
    .single();

  if (callError || !call) {
    console.error('process-call: call not found', callId, callError);
    return NextResponse.json({ error: 'Call not found' }, { status: 404 });
  }

  // Skip if already processed
  if (call.analytics_id) {
    return NextResponse.json({ skipped: true, reason: 'already_processed' });
  }

  if (!call.recording_url) {
    return NextResponse.json({ skipped: true, reason: 'no_recording' });
  }

  // ── Step 2: Rate limit check ────────────────────────────────────────────────
  const { allowed, used, limit } = await checkAIRateLimit(call.user_id);
  if (!allowed) {
    console.warn(`process-call: rate limit hit for user ${call.user_id} (${used}/${limit})`);
    await saveError(supabase, callId, call.user_id, call.lead_id, 'rate_limit_exceeded');
    return NextResponse.json({ skipped: true, reason: 'rate_limit_exceeded' });
  }

  // ── Step 3: Fetch lead context ──────────────────────────────────────────────
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

  // ── Step 4: Fetch previous lead memories ───────────────────────────────────
  let previousMemories = '';
  if (call.lead_id) {
    const { data: memories } = await supabase
      .from('lead_memory')
      .select('memory_type, content, created_at')
      .eq('lead_id', call.lead_id)
      .order('importance_score', { ascending: false })
      .limit(5);

    if (memories && memories.length > 0) {
      previousMemories = memories
        .map((m) => `[${m.memory_type}] ${m.content}`)
        .join('\n');
    }
  }

  // ── Step 5: Download + transcribe audio via Groq Whisper ───────────────────
  let transcript = '';
  let transcriptWords: Array<{ word: string; start: number; end: number }> = [];

  try {
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
  } catch (err) {
    console.error('process-call: transcription failed', err);
    await saveError(supabase, callId, call.user_id, call.lead_id, `transcription_failed: ${String(err)}`);
    return NextResponse.json({ error: 'Transcription failed' }, { status: 500 });
  }

  if (!transcript.trim()) {
    await saveError(supabase, callId, call.user_id, call.lead_id, 'empty_transcript');
    return NextResponse.json({ skipped: true, reason: 'empty_transcript' });
  }

  // ── Step 6: Generate transcript embedding ──────────────────────────────────
  const transcriptEmbedding = await generateEmbedding(transcript);

  // ── Step 7: AI analysis (Gemini → Groq fallback) ──────────────────────────
  let analysis;
  let modelUsed = 'gemini-2.0-flash';

  try {
    analysis = await analyzeCallWithGemini(transcript, companyName, industry, jobTitle, previousMemories);
  } catch (geminiErr) {
    console.warn('process-call: Gemini failed, falling back to Groq Llama', geminiErr);
    modelUsed = 'llama-3.3-70b-versatile';
    try {
      analysis = await analyzeCallWithGroq(transcript, companyName, industry, jobTitle, previousMemories);
    } catch (groqErr) {
      console.error('process-call: both AI providers failed', groqErr);
      await saveError(supabase, callId, call.user_id, call.lead_id, `analysis_failed`);
      return NextResponse.json({ error: 'Analysis failed' }, { status: 500 });
    }
  }

  // ── Step 8: Save call_analytics ────────────────────────────────────────────
  const processingMs = Date.now() - startedAt;
  const analyticsRow: Record<string, unknown> = {
    call_id: callId,
    user_id: call.user_id,
    lead_id: call.lead_id ?? null,
    transcript,
    summary: analysis.summary,
    sentiment: analysis.sentiment,
    sentiment_score: analysis.sentiment_score,
    talking_points: analysis.talking_points,
    objections: analysis.objections,
    buying_signals: analysis.buying_signals,
    next_steps: analysis.next_steps,
    suggested_disposition: analysis.suggested_disposition,
    ai_model_used: modelUsed,
    processing_time_ms: processingMs,
  };

  if (transcriptEmbedding) {
    analyticsRow.transcript_embedding = JSON.stringify(transcriptEmbedding);
  }

  // Store words in summary JSONB for the detail view transcript tab
  if (transcriptWords.length > 0) {
    analyticsRow.summary = {
      bullets: analysis.summary,
      words: transcriptWords,
    };
  }

  const { data: analyticsInserted, error: insertErr } = await supabase
    .from('call_analytics')
    .insert(analyticsRow)
    .select('id')
    .single();

  if (insertErr || !analyticsInserted) {
    console.error('process-call: analytics insert failed', insertErr);
    return NextResponse.json({ error: 'Save failed' }, { status: 500 });
  }

  // Link analytics back to call
  await supabase
    .from('calls')
    .update({ analytics_id: analyticsInserted.id })
    .eq('id', callId);

  // ── Step 9: Save lead memories ─────────────────────────────────────────────
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
    if (failed > 0) console.warn(`process-call: ${failed} memory inserts failed`);
  }

  console.log(`process-call: completed call ${callId} in ${processingMs}ms using ${modelUsed}`);
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
