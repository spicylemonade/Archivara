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
};

export default nextConfig;
