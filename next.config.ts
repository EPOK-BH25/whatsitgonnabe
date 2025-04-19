import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    domains: [
      'firebasestorage.googleapis.com',
      'loremflickr.com'                 
    ],
  },
};

export default nextConfig;
