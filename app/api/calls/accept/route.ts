import { NextRequest, NextResponse } from 'next/server';

export async function POST(_request: NextRequest) {
  return NextResponse.json(
    { error: 'Inbound accept is handled in the browser for Twilio calls.' },
    { status: 410 },
  );
}
