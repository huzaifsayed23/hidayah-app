import type { NextConfig } from "next";

const isMobileBuild = process.env.BUILD_MODE === 'mobile';

const nextConfig: NextConfig = {
  cacheComponents: true,
  ...(isMobileBuild ? { output: 'export' } : {}),
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    ppr: false,
  },
};

export default nextConfig;
