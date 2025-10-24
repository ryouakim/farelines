import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow access to public pages
        const publicPaths = [
          '/',
          '/how-it-works',
          '/pricing',
          '/privacy',
          '/terms',
          '/contact',
          '/auth/signin',
          '/auth/error',
        ]
        
        const path = req.nextUrl.pathname
        
        // Allow public paths
        if (publicPaths.includes(path)) {
          return true
        }
        
        // Protect /app routes
        if (path.startsWith('/app')) {
          return !!token
        }
        
        return true
      },
    },
  }
)

export const config = {
  matcher: [
    '/app/:path*',
    '/api/trips/:path*',
    '/api/user/:path*',
  ]
}
