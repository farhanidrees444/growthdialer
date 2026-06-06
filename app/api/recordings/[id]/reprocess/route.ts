import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isWorkspaceError, requireWorkspaceFromRequest } from '@/lib/auth/workspace-access';
import { isCallAccessError, requireCallAccess } from '@/lib/auth/call-access';
import { hasPermission } from '@/lib/auth/permissions';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const access = await requireWorkspaceFromRequest(request, supabase, user.id);
    if (isWorkspaceError(access)) return access;

    if (
      !hasPermission(access.role, 'VIEW_ALL_RECORDINGS')
      && !hasPermission(access.role, 'VIEW_OWN_RECORDINGS')
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    console.log('[REPROCESS] Requested for call:', id, '| user:', user.id);

    const call = await requireCallAccess(
      supabase,
      { id },
      access,
      user.id,
      hasPermission(access.role, 'VIEW_ALL_RECORDINGS') ? 'read' : 'control',
    );
    if (isCallAccessError(call)) return call;

    const { data: callRow } = await supabase
      .from('calls')
      .select('id, recording_url, ai_processing_status, analytics_id')
      .eq('id', id)
      .maybeSingle();

    if (!callRow) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (!callRow.recording_url) {
      console.warn('[REPROCESS] No recording_url on call:', id);
      return NextResponse.json({ error: 'No recording URL — recording may not have saved yet' }, { status: 400 });
    }

    console.log('[REPROCESS] Call found, recording_url:', callRow.recording_url,
      '| current status:', callRow.ai_processing_status, '| analytics_id:', callRow.analytics_id);

    // Reset AI state so process-call doesn't skip it as already processed
    await supabase
      .from('calls')
      .update({
        ai_processed: false,
        ai_processing_status: 'pending',
        analytics_id: null,
      })
      .eq('id', id);

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? 'http://localhost:3000';
    const aiUrl = `${baseUrl}/api/ai/process-call`;
    console.log('[REPROCESS] Triggering AI at:', aiUrl);

    // Start the request — don't await completion (maxDuration=120 in process-call).
    // We check that the request started successfully before returning.
    let triggerStatus = 0;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s to confirm the request started
      const res = await fetch(aiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-secret': process.env.INTERNAL_API_SECRET ?? '',
        },
        body: JSON.stringify({ call_id: id }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      triggerStatus = res.status;
      const body = await res.text().catch(() => '');
      console.log('[REPROCESS] AI trigger status:', triggerStatus, '| body:', body.slice(0, 200));
    } catch (fetchErr) {
      // AbortError means the 5s timeout hit — request was still sent (process-call started)
      if ((fetchErr as Error).name === 'AbortError') {
        console.log('[REPROCESS] Trigger started (5s timeout) — process-call is running');
      } else {
        console.error('[REPROCESS] Trigger fetch error:', fetchErr);
        return NextResponse.json({ error: 'Failed to reach AI processing endpoint' }, { status: 500 });
      }
    }

    if (triggerStatus === 401) {
      console.error('[REPROCESS] AI endpoint 401 — check INTERNAL_API_SECRET env var');
      return NextResponse.json({ error: 'AI endpoint authentication failed — check INTERNAL_API_SECRET' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Processing started' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed';
    console.error('[REPROCESS] Unexpected error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
