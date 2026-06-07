import { NextResponse } from 'next/server';

/** Public liveness check — never exposes infrastructure or env configuration. */
export async function GET() {
  return NextResponse.json({ ok: true });
}
