export type TelephonyConferenceMode = 'listen' | 'whisper' | 'barge' | 'takeover';

export type AmdMode = 'detect' | 'disabled';

export interface MakeCallParams {
  tenantId: string;
  agentId: string;
  to: string;
  from: string;
  leadId?: string | null;
  webhookUrl: string;
  amd?: AmdMode;
  timeoutSecs?: number;
  clientState?: Record<string, unknown>;
  parallelSessionId?: string | null;
  parallelLegId?: string | null;
}

export interface SendSMSParams {
  tenantId: string;
  agentId: string;
  to: string;
  from: string;
  body: string;
  leadId?: string | null;
}

export interface CallHandle {
  callControlId: string;
  dbCallId: string | null;
  status: string;
}

export interface MessageHandle {
  messageId: string;
  dbMessageId: string | null;
  status: string;
}

export interface ConferenceHandle {
  conferenceId: string;
  callControlId: string;
}

export interface WebRTCTokenResult {
  loginToken: string;
  credentialId: string;
  sipUsername?: string;
}

export interface TelephonyProvider {
  makeCall(params: MakeCallParams): Promise<CallHandle>;
  hangupCall(callControlId: string): Promise<void>;
  sendSMS(params: SendSMSParams): Promise<MessageHandle>;
  startConference(callControlId: string): Promise<ConferenceHandle>;
  joinConference(
    conferenceId: string,
    agentId: string,
    tenantId: string,
    mode: TelephonyConferenceMode,
  ): Promise<void>;
  startRecording(callControlId: string, dbCallId: string): Promise<void>;
  getWebRTCToken(agentId: string, tenantId: string): Promise<WebRTCTokenResult>;
  isConfigured(): boolean;
}

export interface TelephonyWebhookEvent {
  id: string;
  eventType: string;
  callControlId?: string | null;
  messageId?: string | null;
  payload: Record<string, unknown>;
}
