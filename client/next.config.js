/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'topcinemaa.com',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_PROXY_TARGET || 'https://megaflix-iota.vercel.app'}/api/:path*`,
      },
    ]
  },
}

module.exports = nextConfig
