import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next')
  const destination = next && (next.startsWith('/checkout?') || next.startsWith('/checkout/complete?') || next.startsWith('/api/checkout?') || next === '/billing') ? next : '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      return NextResponse.redirect(`${origin}/login?error=auth_callback_failed&next=${encodeURIComponent(destination)}`)
    }
  }


  // Redirect to /dashboard on the SAME origin that served this callback
  // (app.growthdialer.com), so the freshly-set session cookies are used.
  // Never hardcode the marketing apex/www host here.
  return NextResponse.redirect(`${origin}${destination}`)
}
