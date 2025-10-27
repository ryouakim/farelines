/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // ✅ Allow production builds even if ESLint finds warnings or errors
    ignoreDuringBuilds: true,
  },
  typescript: {
    // ✅ Allow production builds even if type errors exist
    ignoreBuildErrors: true,
  },
  // ✅ Proper Content Security Policy (CSP) for Google OAuth and Vercel
  headers: async () => [
    {
      source: "/(.*)",
      headers: [
        {
          key: "Content-Security-Policy",
          value:
            "default-src 'self'; img-src * blob: data:; media-src *; frame-src 'self' https://accounts.google.com https://vercel.live; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com https://vercel.live; connect-src *; style-src 'self' 'unsafe-inline';",
        },
      ],
    },
  ],
};

module.exports = nextConfig;

