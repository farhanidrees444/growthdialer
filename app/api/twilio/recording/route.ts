import { NextRequest, NextResponse } from 'next/server';
import { validateTwilioRequest } from '@/lib/twilio';
import { createServiceClient } from '@/lib/supabase/service';

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('x-twilio-signature');
    const url = `${process.env.NEXT_PUBLIC_APP_URL}/api/twilio/recording`;

    const formData = await request.formData();
    const body: Record<string, any> = {};
    for (const [key, value] of formData.entries()) {
      body[key] = value;
    }

    if (!signature || !validateTwilioRequest(url, signature, body)) {
      console.warn('Twilio recording webhook failed validation, but returning 200 to prevent retries.');
      return new NextResponse('OK', { status: 200 });
    }

    const {
      RecordingUrl,
      RecordingSid,
      RecordingDuration,
      CallSid,
      LeadId,
      leadId,
    } = body;

    const resolvedLeadId = LeadId || leadId || null;
    const duration = RecordingDuration ? Number(RecordingDuration) : undefined;

    const {
      RecordingUrl,
      RecordingSid,
      RecordingDuration,
      CallSid,
      AccountSid,
      LeadId,
      leadId,
    } = body;

    const resolvedLeadId = LeadId || leadId || null;
    const duration = RecordingDuration ? Number(RecordingDuration) : undefined;

    console.log('Recording completed:', {
      recordingSid: RecordingSid,
      callSid: CallSid,
      duration,
      url: RecordingUrl,
      leadId: resolvedLeadId,
      timestamp: new Date().toISOString(),
    });

    const supabase = createServiceClient();
    if (supabase && CallSid) {
      await supabase.from('calls').update(
        {
          recording_url: RecordingUrl ?? undefined,
          recording_sid: RecordingSid ?? undefined,
          recording_duration: duration ?? undefined,
          updated_at: new Date().toISOString(),
        }
      ).eq('twilio_call_sid', CallSid);

      const { data: callRow } = await supabase.from('calls').select('id').eq('twilio_call_sid', CallSid).single();
      if (callRow?.id && RecordingSid) {
        await supabase.from('call_recordings').upsert(
          {
            call_id: callRow.id,
            twilio_recording_sid: RecordingSid,
            url: RecordingUrl ?? undefined,
            duration: duration ?? undefined,
            created_at: new Date().toISOString(),
          },
          { onConflict: 'twilio_recording_sid' }
        );
      }
    }

    return new NextResponse('OK', { status: 200 });

  } catch (error) {
    console.error('Recording webhook error:', error);
    // Still return 200 to prevent Twilio retries
    return new NextResponse('OK', { status: 200 });
  }
}