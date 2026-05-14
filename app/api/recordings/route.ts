import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: authData, error: authError } = await supabase.auth.getSession();
    const userId = authData?.session?.user?.id;

    if (authError || !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const query = (url.searchParams.get('q') ?? '').trim();
    const limit = Number(url.searchParams.get('limit') ?? '25');
    const offset = Number(url.searchParams.get('offset') ?? '0');

    let recordingsQuery = supabase
      .from('calls')
      .select('id,twilio_call_sid,status,disposition,notes,duration,recording_url,recording_duration,started_at,ended_at,lead_id,leads(id,name,company,phone)')
      .eq('user_id', userId)
      .not('recording_url', 'is', null);

    if (query) {
      const escapedQuery = query.replace(/%/g, '\\%').replace(/_/g, '\\_');
      recordingsQuery = recordingsQuery.or(
        `leads.name.ilike.%${escapedQuery}%,leads.company.ilike.%${escapedQuery}%,recording_url.ilike.%${escapedQuery}%`
      );
    }

    const { data, error } = await recordingsQuery
      .order('started_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Recordings query failed:', error);
      return NextResponse.json({ error: 'Unable to load recordings' }, { status: 500 });
    }

    return NextResponse.json({ recordings: data ?? [] });
  } catch (error) {
    console.error('Recordings error:', error);
    return NextResponse.json({ error: 'Unable to load recordings' }, { status: 500 });
  }
}
