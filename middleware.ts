import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Skip middleware if environment variables are not set
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({ request })
  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options))
        },
      },
    }
  )

  try {
    const { data: { user } } = await supabase.auth.getUser()

    const protectedRoutes = [
      '/dashboard', '/dialer', '/leads', '/sequences',
      '/analytics', '/recordings', '/integrations', '/settings',
      '/team'
    ]
    const authRoutes = ['/login', '/signup']
    const path = request.nextUrl.pathname

    if (!user && protectedRoutes.some(r => path.startsWith(r))) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    if (user && authRoutes.includes(path)) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  } catch (error) {
    console.error('[middleware] Auth check failed:', error)
    // Continue to next response if auth check fails
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
