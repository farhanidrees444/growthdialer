import { NextRequest, NextResponse } from 'next/server';
import { validateTwilioRequest } from '@/lib/twilio';
import { createServiceClient } from '@/lib/supabase/service';

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('x-twilio-signature');
    const url = `${process.env.NEXT_PUBLIC_APP_URL}/api/twilio/status`;

    const formData = await request.formData();
    const body: Record<string, any> = {};
    for (const [key, value] of formData.entries()) {
      body[key] = value;
    }

    if (!signature || !validateTwilioRequest(url, signature, body)) {
      console.warn('Twilio status webhook failed validation, but returning 200 to prevent retries.');
      return new NextResponse('OK', { status: 200 });
    }

    const {
      CallSid,
      CallStatus,
      From,
      To,
      Direction,
      CallDuration,
      AnsweredBy,
      RecordingUrl,
      RecordingSid,
      RecordingDuration,
      LeadId,
      leadId,
      UserId,
      userId,
    } = body;

    const resolvedLeadId = LeadId || leadId || null;
    const resolvedUserId = UserId || userId || null;
    const durationValue = CallDuration ? Number(CallDuration) : undefined;
    const isFinalStatus = ['completed', 'busy', 'failed', 'no-answer'].includes(CallStatus ?? '');

    console.log('Call status update:', {
      callSid: CallSid,
      status: CallStatus,
      direction: Direction,
      duration: CallDuration,
      answeredBy: AnsweredBy,
      leadId: resolvedLeadId,
      userId: resolvedUserId,
      timestamp: new Date().toISOString(),
    });

    const supabase = createServiceClient();
    if (supabase && CallSid) {
      // Column names match the SQL schema (duration_seconds, not duration)
      const upsertPayload: Record<string, any> = {
        twilio_call_sid: CallSid,
        status: CallStatus ?? undefined,
        direction: Direction ?? undefined,
        ended_at: isFinalStatus ? new Date().toISOString() : undefined,
        updated_at: new Date().toISOString(),
      };
      if (resolvedUserId) upsertPayload.user_id = resolvedUserId;
      if (resolvedLeadId) upsertPayload.lead_id = resolvedLeadId;
      if (From) upsertPayload.from_number = From;
      if (To) upsertPayload.to_number = To;
      if (durationValue !== undefined) upsertPayload.duration_seconds = durationValue;
      if (RecordingUrl) upsertPayload.recording_url = RecordingUrl;

      await supabase.from('calls').upsert(upsertPayload, { onConflict: 'twilio_call_sid' });

      if (resolvedLeadId) {
        await supabase.from('leads').update({ last_called_at: new Date().toISOString() }).eq('id', resolvedLeadId);
      }
    }

    return new NextResponse('OK', { status: 200 });

  } catch (error) {
    console.error('Status webhook error:', error);
    // Still return 200 to prevent Twilio retries
    return new NextResponse('OK', { status: 200 });
  }
}