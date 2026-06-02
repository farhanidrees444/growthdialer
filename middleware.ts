import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Skip middleware for marketing pages and public routes
  const publicRoutes = ['/', '/about', '/pricing', '/features', '/contact', '/docs']
  const path = request.nextUrl.pathname
  
  // Allow public routes to pass through without Supabase check
  if (publicRoutes.includes(path) || path.startsWith('/_next') || path.startsWith('/public')) {
    return NextResponse.next({ request })
  }

  // Only run auth checks on protected routes
  const protectedRoutes = [
    '/dashboard', '/dialer', '/leads', '/sequences',
    '/analytics', '/recordings', '/integrations', '/settings',
    '/team'
  ]
  const authRoutes = ['/login', '/signup']
  
  // Check if Supabase credentials exist
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    // If no Supabase config, allow access to continue (development mode)
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

  const { data: { user } } = await supabase.auth.getUser()

  if (!user && protectedRoutes.some(r => path.startsWith(r))) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (user && authRoutes.includes(path)) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
