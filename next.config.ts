import type { NextConfig } from "next";

const distDir = process.env.NEXT_DIST_DIR;

const nextConfig: NextConfig = {
  ...(distDir ? { distDir } : {}),
  serverExternalPackages: ["@napi-rs/canvas"],
  typescript: {
    // Skip type checking during build - type check separately via IDE/CI
    ignoreBuildErrors: true
  },
  eslint: {
    // Skip ESLint during build - run linting separately
    ignoreDuringBuilds: true
  }
};

export default nextConfig;
