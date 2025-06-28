import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for Docker
  output: 'standalone',

  // Disable ESLint during build for Vercel deployment
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Disable TypeScript errors during build for Vercel deployment
  typescript: {
    ignoreBuildErrors: true,
  },

  // Image optimization
  images: {
    domains: ['via.placeholder.com', 'localhost'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/uploads/**',
      },
    ],
  },

  // Environment variables
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },

  // External packages for server components
  serverExternalPackages: ['mongoose', 'sharp'],
};

export default nextConfig;
