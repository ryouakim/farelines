/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['lh3.googleusercontent.com', 'avatars.githubusercontent.com'],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Content-Security-Policy',
            // ✅ updated to allow OAuth + Vercel + API connections
            value:
              "default-src 'self'; " +
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://accounts.google.com https://www.googletagmanager.com; " +
              "style-src 'self' 'unsafe-inline'; " +
              "img-src 'self' blob: data: https:; " +
              "font-src 'self' data:; " +
              "connect-src 'self' https://accounts.google.com https://www.googleapis.com https://vercel.live;"
          }
        ]
      }
    ]
  }
}

module.exports = nextConfig

