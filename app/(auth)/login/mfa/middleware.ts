import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value)
          })

          response = NextResponse.next({
            request,
          })

          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  const publicRoutes = [
    '/login',
    '/login/mfa',
    '/recuperar-senha',
    '/convite',
  ]

  const isPublicRoute =
    publicRoutes.some(
      (route) =>
        pathname === route ||
        pathname.startsWith(`${route}/`)
    )

  if (!user && !isPublicRoute) {
    return NextResponse.redirect(
      new URL('/login', request.url)
    )
  }

  if (user && pathname === '/login') {
    return NextResponse.redirect(
      new URL('/dashboard', request.url)
    )
  }

  if (user && pathname === '/login/mfa') {
    return response
  }

  if (user && !isPublicRoute) {
    const {
      data: assuranceData,
      error: assuranceError,
    } =
      await supabase.auth.mfa.getAuthenticatorAssuranceLevel()

    if (
      !assuranceError &&
      assuranceData.currentLevel === 'aal1' &&
      assuranceData.nextLevel === 'aal2'
    ) {
      return NextResponse.redirect(
        new URL('/login/mfa', request.url)
      )
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}