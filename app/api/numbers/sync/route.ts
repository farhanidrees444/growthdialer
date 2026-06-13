import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isWorkspaceError, requireWorkspaceFromRequest } from '@/lib/auth/workspace-access';
import { calculateRetailPrice } from '@/lib/pricing/calculate-price';
import { assignNumberToVoiceConnection } from '@/lib/voice/assign-number-connection';
import { getActiveCallControlAppId } from '@/lib/voice/configure-connection';
import { voiceApiBearerToken } from '@/lib/voice/read-env';

export const dynamic = 'force-dynamic';

async function tagNumberForUser(
  telnyxNumberId: string,
  userId: string,
  userEmail: string,
  connectionId: string | null,
): Promise<void> {
  const tags = [`user:${userId}`];
  if (userEmail) tags.push(`email:${userEmail}`);

  const res = await fetch(`https://api.telnyx.com/v2/phone_numbers/${telnyxNumberId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${voiceApiBearerToken()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      tags,
      ...(connectionId ? { connection_id: connectionId } : {}),
    }),
  });

  if (!res.ok) {
    console.error('[NUMBERS-SYNC] Tag failed:', telnyxNumberId, res.status, (await res.text()).slice(0, 200));
  }
}

export async function POST(request: NextRequest) {
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
      isOwner
      && (body.claim_untagged === true || (ownedCount ?? 0) === 0);

    const connectionId = await getActiveCallControlAppId();

    console.log('[NUMBERS-SYNC] Starting for user:', userId, '| claim_orphans:', canClaimOrphans);

    const res = await fetch('https://api.telnyx.com/v2/phone_numbers?page[size]=250', {
      headers: { Authorization: `Bearer ${voiceApiBearerToken()}` },
    });

    if (!res.ok) {
      console.error('[NUMBERS-SYNC] Provider fetch failed:', res.status, await res.text());
      return NextResponse.json({ error: 'Failed to fetch numbers from provider' }, { status: 500 });
    }

    const { data: telnyxNumbers } = await res.json() as { data?: Record<string, unknown>[] };
    let synced = 0;
    let skipped = 0;

    for (const num of telnyxNumbers ?? []) {
      const phoneNumber = num.phone_number as string;
      const telnyxNumberId = num.id as string;
      const tags = (num.tags as string[] | null) ?? [];
      const wholesale = parseFloat(
        ((num.costs as { monthly?: { amount?: string } } | null)?.monthly?.amount) ?? '1.00'
      );
      const purchasedAt = (num.created_at as string | null) ?? new Date().toISOString();
      const nextBillingDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      // Determine ownership from Telnyx tag
      const userTag = tags.find((t) => t.startsWith('user:'));
      const tagUserId = userTag?.replace('user:', '') ?? null;

      // If tagged to a different user — never touch this number
      if (tagUserId && tagUserId !== userId) {
        console.log('[NUMBERS-SYNC] Skipping', phoneNumber, '— tagged to another user');
        skipped++;
        continue;
      }

      // If untagged and not in DB under this user — do not auto-claim
      const { data: existing } = await supabase
        .from('purchased_numbers')
        .select('id, user_id')
        .eq('telnyx_number_id', telnyxNumberId)
        .maybeSingle();

      if (existing) {
        if (existing.user_id === userId) {
          // Already mine — refresh status fields
          const { error } = await supabase
            .from('purchased_numbers')
            .update({
              phone_number: phoneNumber,
              status: (num.status as string) === 'active' ? 'active' : 'inactive',
              monthly_cost: wholesale,
              billing_status: 'active',
              next_billing_date: nextBillingDate,
            })
            .eq('id', existing.id);
          if (!error) {
            synced++;
            await assignNumberToVoiceConnection(telnyxNumberId);
          } else console.error('[NUMBERS-SYNC] Update error for', phoneNumber, ':', error);
        } else if (tagUserId === userId) {
          // Tagged to me but DB has wrong owner — correct it
          console.log('[NUMBERS-SYNC] Correcting ownership for', phoneNumber);
          const { error } = await supabase
            .from('purchased_numbers')
            .update({ user_id: userId, status: 'active', billing_status: 'active' })
            .eq('id', existing.id);
          if (!error) synced++;
          else console.error('[NUMBERS-SYNC] Ownership correction error:', error);
        } else {
          // In DB under a different user, not tagged to me — skip
          skipped++;
        }
      } else if (tagUserId === userId) {
        // Tagged to me, not in DB at all — recover it
        console.log('[NUMBERS-SYNC] Recovering tagged number:', phoneNumber);
        const { error } = await supabase
          .from('purchased_numbers')
          .insert({
            user_id: userId,
            telnyx_number_id: telnyxNumberId,
            phone_number: phoneNumber,
            country: (num.country_code as string | null) ?? 'US',
            number_type: (num.phone_number_type as string | null) ?? 'local',
            status: (num.status as string) === 'active' ? 'active' : 'inactive',
            monthly_cost: wholesale,
            billing_status: 'active',
            auto_renew: true,
            purchased_at: purchasedAt,
            next_billing_date: nextBillingDate,
          });
        if (!error) {
          synced++;
          void assignNumberToVoiceConnection(telnyxNumberId);
        } else console.error('[NUMBERS-SYNC] Recovery insert error for', phoneNumber, ':', error);
      } else if (canClaimOrphans) {
        // Untagged orphan — workspace owner may claim when setting up inbound
        console.log('[NUMBERS-SYNC] Claiming untagged orphan:', phoneNumber);
        const { error } = await supabase
          .from('purchased_numbers')
          .insert({
            user_id: userId,
            telnyx_number_id: telnyxNumberId,
            phone_number: phoneNumber,
            country: (num.country_code as string | null) ?? 'US',
            number_type: (num.phone_number_type as string | null) ?? 'local',
            status: (num.status as string) === 'active' ? 'active' : 'inactive',
            monthly_cost: wholesale,
            billing_status: 'active',
            auto_renew: true,
            purchased_at: purchasedAt,
            next_billing_date: nextBillingDate,
          });
        if (!error) {
          synced++;
          await tagNumberForUser(telnyxNumberId, userId, userEmail, connectionId);
          await assignNumberToVoiceConnection(telnyxNumberId);
        } else {
          console.error('[NUMBERS-SYNC] Orphan claim insert error for', phoneNumber, ':', error);
          skipped++;
        }
      } else {
        skipped++;
      }
    }

    // Auto-set default if user has none
    if (synced > 0) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('default_number')
        .eq('user_id', userId)
        .single();

      if (!profile?.default_number) {
        const { data: firstNumber } = await supabase
          .from('purchased_numbers')
          .select('phone_number')
          .eq('user_id', userId)
          .eq('status', 'active')
          .order('purchased_at', { ascending: true })
          .limit(1)
          .single();

        if (firstNumber?.phone_number) {
          await supabase
            .from('profiles')
            .update({ default_number: firstNumber.phone_number })
            .eq('user_id', userId);
        }
      }
    }

    let message: string;
    if (synced > 0) {
      message = `Linked ${synced} number${synced !== 1 ? 's' : ''} to your account`;
    } else if (skipped > 0 && (telnyxNumbers?.length ?? 0) > 0) {
      message =
        `${skipped} line${skipped !== 1 ? 's' : ''} in your voice account could not be linked — they may belong to another user. Buy a new number or contact support.`;
    } else {
      message = 'No numbers found in your voice account. Buy a number to get started.';
    }

    console.log('[NUMBERS-SYNC] Done. Synced:', synced, 'Skipped:', skipped);
    return NextResponse.json({ synced, skipped, total: telnyxNumbers?.length ?? 0, message });
  } catch (err) {
    console.error('[NUMBERS-SYNC] Exception:', err);
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
  }
}

// Export for pricing reuse
export { calculateRetailPrice };
