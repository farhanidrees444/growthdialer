'use client';

/**
 * Incoming-call modal — subscribes to Supabase Realtime `incoming-calls:{userId}` broadcasts
 * and delegates accept/decline to InboundRingingProvider.
 */
export { InboundCallOverlay as IncomingCallModal } from '@/components/inbound/inbound-call-overlay';
