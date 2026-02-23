import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@bowerbird-poc/ui', '@bowerbird-poc/shared'],
};

export default nextConfig;
