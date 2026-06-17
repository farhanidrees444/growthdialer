import { NextRequest, NextResponse } from 'next/server';

export async function POST(_request: NextRequest) {
  return NextResponse.json({ ok: true, deprecated: true }, { status: 410 });
}

export async function GET(_request: NextRequest) {
  return NextResponse.json({ ok: true, deprecated: true }, { status: 410 });
}
