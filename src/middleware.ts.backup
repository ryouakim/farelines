import { withAuth } from 'next-auth/middleware'

export default withAuth({
  pages: {
    signIn: '/auth/signin',
  },
})

// Only protect /app routes
export const config = {
  matcher: ['/app/:path*']
}