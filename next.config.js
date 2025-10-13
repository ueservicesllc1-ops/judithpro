/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost', 'moises2-production.up.railway.app', 'judith.life'],
  },
  async rewrites() {
    return [
      {
        source: '/api/upload/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/upload/:path*`,
      },
      {
        source: '/api/health',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/health`,
      },
    ]
  },
}

module.exports = nextConfig
