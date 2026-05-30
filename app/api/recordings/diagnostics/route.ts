import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/recordings/diagnostics
// Authenticated. Returns a checklist that explains exactly why the recordings
// page may be empty for the calling user. Designed to be hit once after a test
// call to see where the pipeline is failing.
export async function GET(_req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // 1. Env vars the recording pipeline needs
  const env = {
    TELNYX_API_KEY: !!process.env.TELNYX_API_KEY,
    TELNYX_CONNECTION_ID: !!process.env.TELNYX_CONNECTION_ID,
    APP_URL: !!process.env.APP_URL,
    NEXT_PUBLIC_APP_URL: !!process.env.NEXT_PUBLIC_APP_URL,
    INTERNAL_API_SECRET: !!process.env.INTERNAL_API_SECRET,
    GROQ_API_KEY: !!process.env.GROQ_API_KEY,
    GEMINI_API_KEY: !!process.env.GEMINI_API_KEY,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
  };

  // 2. User recording preferences
  const { data: settings } = await supabase
    .from('user_settings')
    .select('recording_mode, recording_auto_delete_short, ai_auto_transcribe, ai_auto_summarize')
    .eq('user_id', user.id)
    .maybeSingle();

  // 3. Counts: total calls, calls with recording_url, calls long enough
  const { count: totalCalls } = await supabase
    .from('calls')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  const { count: withUrl } = await supabase
    .from('calls')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .not('recording_url', 'is', null);

  const { count: longEnough } = await supabase
    .from('calls')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('duration_seconds', 30);

  const { count: recordedFlag } = await supabase
    .from('calls')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('was_recorded', true);

  // 4. Most recent 5 calls — show what state they are in
  const { data: recent } = await supabase
    .from('calls')
    .select(
      'id, created_at, status, duration_seconds, was_recorded, recording_url, ai_processing_status, ai_error, hangup_cause',
    )
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5);

  // 5. Generate a human-readable diagnosis
  const issues: string[] = [];

  if (!env.TELNYX_API_KEY) issues.push('TELNYX_API_KEY missing — recordings cannot be started.');
  if (!env.APP_URL && !env.NEXT_PUBLIC_APP_URL)
    issues.push('APP_URL / NEXT_PUBLIC_APP_URL missing — Telnyx webhook cannot reach AI pipeline.');
  if (!env.SUPABASE_SERVICE_ROLE_KEY)
    issues.push('SUPABASE_SERVICE_ROLE_KEY missing — webhook cannot write to DB.');
  if (!env.GROQ_API_KEY) issues.push('GROQ_API_KEY missing — Whisper transcription disabled.');
  if (!env.GEMINI_API_KEY) issues.push('GEMINI_API_KEY missing — AI analysis will fall back to Groq only.');

  if (settings?.recording_mode === 'never') {
    issues.push("Settings → Calling → Recording mode is 'never'. Set it to 'always' to record.");
  }

  if (totalCalls && totalCalls > 0) {
    if (recordedFlag === 0) {
      issues.push(
        'You have calls but none have was_recorded=true. Telnyx webhook never fired call.answered → record_start. Check that the Telnyx Voice App webhook URL points at https://YOUR-DOMAIN/api/telnyx/webhook.',
      );
    } else if (withUrl === 0) {
      issues.push(
        'Calls have was_recorded=true but no recording_url. Telnyx never fired call.recording.saved. In the Telnyx portal → Voice App, enable "Programmatic Voice Recording" OR check storage settings (S3 vs Telnyx storage).',
      );
    }
  }

  if (longEnough === 0 && totalCalls && totalCalls > 0) {
    issues.push(
      `None of your ${totalCalls} calls reached 30 seconds duration. Recordings under 30s are auto-discarded. Make a longer test call.`,
    );
  }

  return NextResponse.json({
    ok: issues.length === 0,
    summary: {
      total_calls: totalCalls ?? 0,
      calls_with_recording_url: withUrl ?? 0,
      calls_marked_was_recorded: recordedFlag ?? 0,
      calls_over_30s: longEnough ?? 0,
    },
    env,
    settings: settings ?? { note: 'No user_settings row — using defaults (recording_mode=always)' },
    recent_calls: recent ?? [],
    issues,
    next_step:
      issues.length === 0
        ? 'Pipeline looks healthy. Make a test call >30s and refresh /recordings within 60s.'
        : 'Fix the issues above. Most common: Telnyx webhook URL not configured.',
  });
}
