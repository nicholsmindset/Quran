import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  eslint: {
    // Warning: This disables ESLint during production builds
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Warning: This allows production builds to successfully complete even if there are type errors
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
