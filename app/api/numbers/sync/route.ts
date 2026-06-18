import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isWorkspaceError, requireWorkspaceFromRequest } from '@/lib/auth/workspace-access';
import { isTwilioVoiceConfigured } from '@/lib/twilio/voice-config';
import { syncTwilioNumbersForUser } from '@/lib/twilio/number-inventory';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  if (!isTwilioVoiceConfigured()) {
    return NextResponse.json({ error: 'Voice service is not configured' }, { status: 503 });
  }

  try {
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    const userId = authUser?.id;
    const userEmail = authUser?.email ?? '';
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = (await request.json().catch(() => ({}))) as { claim_untagged?: boolean };
    const access = await requireWorkspaceFromRequest(request, supabase, userId, { body });
    if (isWorkspaceError(access)) return access;

    const isOwner = access.role === 'owner' || access.role === 'admin';
    const { count: ownedCount } = await supabase
      .from('purchased_numbers')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .neq('status', 'released');

    const canClaimOrphans =
      isOwner && (body.claim_untagged === true || (ownedCount ?? 0) === 0);

    const result = await syncTwilioNumbersForUser(supabase, userId, userEmail, {
      claimOrphans: canClaimOrphans,
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error('[NUMBERS-SYNC]', err);
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
  }
}
