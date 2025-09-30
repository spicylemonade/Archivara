/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Don't block production builds on ESLint errors
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Don't block production builds on TypeScript errors
    ignoreBuildErrors: true,
  },
  // Allow Railway domains
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          }
        ],
      },
    ]
  },
  // Disable host check for Railway
  experimental: {
    allowedOrigins: ['*'],
  },
};

export default nextConfig;
