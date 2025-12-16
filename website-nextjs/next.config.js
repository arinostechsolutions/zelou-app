/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Otimizações de performance
  swcMinify: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Otimizações de bundle
  experimental: {
    optimizePackageImports: ['recharts', 'date-fns'],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.BACKEND_URL || 'http://localhost:3000'}/api/:path*`,
      },
    ]
  },
}

module.exports = nextConfig

