import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Returns the VAPID public key so browsers can subscribe for push.
 * The public key is public by design; the private key stays server-side
 * and is never exposed here.
 */
export async function GET() {
  const publicKey = process.env.VAPID_PUBLIC_KEY ?? null;
  return NextResponse.json({ publicKey });
}
