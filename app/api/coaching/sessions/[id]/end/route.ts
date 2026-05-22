import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type Ctx = { params: Promise<{ id: string }> };

// POST /api/coaching/sessions/[id]/end
// Body: { rating?: number (1-5), feedback?: string, notes?: string }
export async function POST(request: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json() as { rating?: number; feedback?: string; notes?: string };

  // Verify session belongs to coach
  const { data: coachSession } = await supabase
    .from('coaching_sessions')
    .select('id, coach_id')
    .eq('id', id)
    .is('ended_at', null)
    .single();

  if (!coachSession) return NextResponse.json({ error: 'Session not found or already ended' }, { status: 404 });
  if (coachSession.coach_id !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const patch: Record<string, unknown> = { ended_at: new Date().toISOString() };
  if (body.rating && body.rating >= 1 && body.rating <= 5) patch.rating = Math.round(body.rating);
  if (body.feedback) patch.feedback = body.feedback.slice(0, 5000);
  if (body.notes) patch.notes = body.notes.slice(0, 5000);

  const { error } = await supabase
    .from('coaching_sessions')
    .update(patch)
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
