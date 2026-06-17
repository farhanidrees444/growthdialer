import { NextRequest, NextResponse } from 'next/server';

export async function POST(_request: NextRequest) {
  return NextResponse.json(
    { error: 'Parallel dial is temporarily unavailable during voice platform upgrade.' },
    { status: 503 },
  );
}
