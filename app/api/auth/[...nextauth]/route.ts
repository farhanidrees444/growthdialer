import { NextResponse } from 'next/server';

/** Legacy NextAuth route — app uses Supabase Auth. */
export function GET() {
  return NextResponse.json({ error: 'Auth endpoint removed' }, { status: 410 });
}

export function POST() {
  return NextResponse.json({ error: 'Auth endpoint removed' }, { status: 410 });
}
