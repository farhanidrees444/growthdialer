import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { findLeadByCallerPhone } from '@/lib/inbound/match-lead';
import { lookupCallerIdentity, isAnonymousCaller } from '@/lib/inbound/lookup-caller';
import { normalizeE164 } from '@/lib/inbound/phone';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const fromRaw = request.nextUrl.searchParams.get('from')?.trim() ?? '';
  if (!fromRaw) {
    return NextResponse.json({ error: 'from required' }, { status: 400 });
  }

  const anonymous = isAnonymousCaller(fromRaw);
  const from = anonymous ? null : normalizeE164(fromRaw);

  const [lead, lookup] = await Promise.all([
    from ? findLeadByCallerPhone(supabase, user.id, from) : Promise.resolve(null),
    from ? lookupCallerIdentity(from) : Promise.resolve(null),
  ]);

  let pastCallCount = 0;
  let lastDisposition: string | null = null;

  if (from) {
    const { count } = await supabase
      .from('calls')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('direction', 'inbound')
      .eq('from_number', from);

    pastCallCount = count ?? 0;

    const { data: lastCall } = await supabase
      .from('calls')
      .select('disposition')
      .eq('user_id', user.id)
      .eq('direction', 'inbound')
      .eq('from_number', from)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    lastDisposition = (lastCall?.disposition as string | undefined) ?? null;
  }

  return NextResponse.json({
    anonymous,
    from,
    lead: lead
      ? {
          id: lead.id,
          name: [lead.first_name, lead.last_name].filter(Boolean).join(' ') || null,
          company: lead.company,
        }
      : null,
    lookup,
    past_call_count: pastCallCount,
    last_disposition: lastDisposition,
  });
}
