import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import telnyxClient, { toE164 } from '@/lib/telnyx';

interface DialTarget {
  phone: string;
  lead_id?: string;
}

interface DialResult {
  phone: string;
  lead_id?: string;
  call_control_id?: string;
  status: 'initiated' | 'failed';
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    const userId = authUser?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { leads } = body as { leads: DialTarget[] };

    if (!Array.isArray(leads) || leads.length === 0) {
      return NextResponse.json({ error: 'Missing "leads" array' }, { status: 400 });
    }

    if (leads.length > 10) {
      return NextResponse.json({ error: 'Maximum 10 parallel calls allowed' }, { status: 400 });
    }

    const webhookUrl = `${process.env.APP_URL}/api/telnyx/webhook`;

    const results: DialResult[] = await Promise.all(
      leads.map(async (target): Promise<DialResult> => {
        const e164 = toE164(target.phone);
        if (!e164) {
          return { phone: target.phone, lead_id: target.lead_id, status: 'failed', error: 'Invalid phone number' };
        }

        try {
          const result = await telnyxClient.calls.dial({
            connection_id: process.env.TELNYX_CONNECTION_ID!,
            to: e164,
            from: process.env.TELNYX_FROM_NUMBER!,
            webhook_url: webhookUrl,
            webhook_url_method: 'POST',
          });

          const callControlId = result.data?.call_control_id;

          if (callControlId) {
            const nowIso = new Date().toISOString();
            const { error: insertError } = await supabase.from('calls').insert({
              user_id: userId,
              lead_id: target.lead_id ?? null,
              direction: 'outbound',
              to_number: e164,
              from_number: process.env.TELNYX_FROM_NUMBER,
              telnyx_call_id: callControlId,
              status: 'initiated',
              started_at: nowIso,
              created_at: nowIso,
            });
            if (insertError) {
              console.error(`Failed to insert call record for ${e164}:`, insertError);
            }
          }

          return { phone: e164, lead_id: target.lead_id, call_control_id: callControlId, status: 'initiated' };
        } catch (err) {
          console.error(`Failed to dial ${e164}:`, err);
          return {
            phone: e164,
            lead_id: target.lead_id,
            status: 'failed',
            error: err instanceof Error ? err.message : 'Unknown error',
          };
        }
      }),
    );

    const succeeded = results.filter((r) => r.status === 'initiated').length;
    const failed = results.filter((r) => r.status === 'failed').length;

    return NextResponse.json({ results, total: leads.length, succeeded, failed });
  } catch (error) {
    console.error('Parallel dial error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to initiate parallel calls' },
      { status: 500 },
    );
  }
}
