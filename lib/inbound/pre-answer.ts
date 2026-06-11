/** Browser is ringing for inbound PSTN — not a live outbound/manual session yet. */
export function isInboundPreAnswer(
  isInboundRinging: boolean,
  hasOutboundSession: boolean,
  callStatus: string,
): boolean {
  return (
    isInboundRinging
    && !hasOutboundSession
    && (callStatus === 'ringing' || callStatus === 'connecting')
  );
}
