import type { NextConfig } from "next";

const isMobileBuild = process.env.BUILD_MODE === 'mobile';

const nextConfig: NextConfig = {
  ...(isMobileBuild ? { output: 'export' } : {}),
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
