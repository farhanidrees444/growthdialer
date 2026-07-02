import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import type {
  CallHandle,
  ConferenceHandle,
  MakeCallParams,
  MessageHandle,
  SendSMSParams,
  TelephonyConferenceMode,
  TelephonyProvider,
  WebRTCTokenResult,
} from '@/lib/telephony/types';
import { isTelephonyConfigured } from '@/lib/telephony/telnyx/env';
import { dialOutboundCall, hangupProviderCall } from '@/lib/telephony/telnyx/outbound';
import { sendProviderSms } from '@/lib/telephony/telnyx/sms';
import { issueWebRtcToken } from '@/lib/telephony/telnyx/webrtc';
import {
  createConferenceForCall,
  joinConferenceAsManager,
} from '@/lib/telephony/telnyx/conference';
import { startMediaForkRecording } from '@/lib/telephony/telnyx/recording';

export class TelnyxTelephonyProvider implements TelephonyProvider {
  isConfigured(): boolean {
    return isTelephonyConfigured();
  }

  async makeCall(params: MakeCallParams): Promise<CallHandle> {
    const supabase = await createClient();
    return dialOutboundCall(supabase, params);
  }

  async hangupCall(callControlId: string): Promise<void> {
    await hangupProviderCall(callControlId);
  }

  async sendSMS(params: SendSMSParams): Promise<MessageHandle> {
    const supabase = await createClient();
    return sendProviderSms(supabase, params);
  }

  async startConference(callControlId: string): Promise<ConferenceHandle> {
    return createConferenceForCall(callControlId);
  }

  async joinConference(
    conferenceId: string,
    agentId: string,
    tenantId: string,
    mode: TelephonyConferenceMode,
  ): Promise<void> {
    await joinConferenceAsManager(conferenceId, agentId, tenantId, mode);
  }

  async startRecording(callControlId: string, dbCallId: string): Promise<void> {
    await startMediaForkRecording(callControlId, dbCallId);
  }

  async getWebRTCToken(agentId: string, tenantId: string): Promise<WebRTCTokenResult> {
    const supabase = await createClient();
    return issueWebRtcToken(supabase as SupabaseClient, agentId, tenantId);
  }
}

export const telnyxTelephonyProvider = new TelnyxTelephonyProvider();
