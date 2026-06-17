import { NextRequest, NextResponse } from 'next/server';

export async function GET(_request: NextRequest) {
  return NextResponse.json({ error: 'Use /api/twilio/token' }, { status: 410 });
}

export async function POST(_request: NextRequest) {
  return NextResponse.json({ error: 'Use /api/twilio/token' }, { status: 410 });
}
