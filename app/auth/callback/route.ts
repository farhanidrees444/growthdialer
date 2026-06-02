import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  // Redirect to /dashboard on the SAME origin that served this callback
  // (app.growthdialer.com), so the freshly-set session cookies are used.
  // Never hardcode the marketing apex/www host here.
  return NextResponse.redirect(`${origin}/dashboard`)
}
