import { NextRequest, NextResponse } from 'next/server';
import { appendFileSync } from 'fs';
import { join } from 'path';

const LOG_FILE = join(process.cwd(), 'debug-30998c.log');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    appendFileSync(LOG_FILE, `${JSON.stringify(body)}\n`, { encoding: 'utf8' });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
