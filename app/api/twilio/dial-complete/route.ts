import { NextRequest, NextResponse } from 'next/server';
import { VoiceResponse, validateTwilioRequest } from '@/lib/twilio';
import { createServiceClient } from '@/lib/supabase/service';

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('x-twilio-signature');
    const url = `${process.env.NEXT_PUBLIC_APP_URL}/api/twilio/dial-complete`;

    const formData = await request.formData();
    const body: Record<string, any> = {};
    for (const [key, value] of formData.entries()) {
      body[key] = value;
    }

    if (!signature || !validateTwilioRequest(url, signature, body)) {
      console.warn('Dial complete webhook failed validation, but returning hangup response.');
      const errorTwiML = new VoiceResponse();
      errorTwiML.hangup();
      return new NextResponse(errorTwiML.toString(), {
        headers: { 'Content-Type': 'text/xml' },
      });
    }

    const {
      DialCallStatus,
      DialCallSid,
      DialCallDuration,
      CallSid,
      RecordingUrl,
      LeadId,
      leadId,
    } = body;

    const resolvedLeadId = LeadId || leadId || null;
    const duration = DialCallDuration ? Number(DialCallDuration) : undefined;

    console.log('Dial completed:', {
      callSid: CallSid,
      dialCallSid: DialCallSid,
      status: DialCallStatus,
      duration,
      recordingUrl: RecordingUrl,
      leadId: resolvedLeadId,
      timestamp: new Date().toISOString(),
    });

    const supabase = createServiceClient();
    if (supabase && CallSid) {
      await supabase.from('calls').upsert(
        {
          twilio_call_sid: CallSid,
          recording_url: RecordingUrl ?? undefined,
          outcome: DialCallStatus ?? undefined,
          duration: duration ?? undefined,
          lead_id: resolvedLeadId ?? undefined,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'twilio_call_sid' }
      );
    }

    const twiml = new VoiceResponse();
    twiml.hangup();

    return new NextResponse(twiml.toString(), {
      headers: {
        'Content-Type': 'text/xml',
      },
    });

  } catch (error) {
    console.error('Dial complete error:', error);
    const twiml = new VoiceResponse();
    twiml.hangup();

    return new NextResponse(twiml.toString(), {
      status: 500,
      headers: {
        'Content-Type': 'text/xml',
      },
    });
  }
}