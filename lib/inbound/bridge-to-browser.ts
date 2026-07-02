import { telnyxCallActionDetailed } from '@/lib/inbound/telnyx-actions';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Manual bridge for the Parallel Dialer's winning prospect leg + agent WebRTC
 * leg (`gd_parallel_bridge`). Inbound ring-group routing does not use this —
 * inbound agent legs are Telnyx SIP Transfer targets, bridged natively by
 * Telnyx itself (see `lib/telephony/telnyx/inbound-router.ts`).
 */
export async function completeInboundBridge(
  callControlIdA: string,
  callControlIdB: string,
): Promise<boolean> {
  const tryBridge = async (fromId: string, toId: string) =>
    telnyxCallActionDetailed(fromId, 'bridge', {
      call_control_id_to_bridge_with: toId,
    });

  let bridged = await tryBridge(callControlIdA, callControlIdB);
  if (bridged.ok) {
    console.log('[PARALLEL] Bridge complete | A:', callControlIdA, '| B:', callControlIdB);
    return true;
  }

  const answerRes = await telnyxCallActionDetailed(callControlIdA, 'answer');
  const answerRejectedOutbound =
    answerRes.status === 422
    && (answerRes.detail?.includes('outbound') ?? false);

  if (answerRejectedOutbound) {
    bridged = await tryBridge(callControlIdB, callControlIdA);
    if (bridged.ok) {
      console.log('[PARALLEL] Bridge complete (leg swap) | A:', callControlIdB, '| B:', callControlIdA);
      return true;
    }
  } else if (answerRes.ok) {
    await sleep(400);
    bridged = await tryBridge(callControlIdA, callControlIdB);
    if (bridged.ok) {
      console.log('[PARALLEL] Bridge complete after answer | A:', callControlIdA);
      return true;
    }
  }

  console.error('[PARALLEL] Bridge failed:', bridged.detail?.slice(0, 200));
  return false;
}
