import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    // If user is authenticated, allow the request
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow access if token exists (user is logged in)
        // Or if accessing public routes
        const isPublicRoute = !req.nextUrl.pathname.startsWith('/app')
        return token !== null || isPublicRoute
      }
    },
    pages: {
      signIn: '/auth/signin',
    }
  }
)

// Protect only /app routes
export const config = {
  matcher: ['/app/:path*']
}