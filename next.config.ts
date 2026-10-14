import type { NextConfig } from "next";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development",
  workboxOptions: {
    disableDevLogs: true,
  },
});

// Uploaded images are served from Supabase Storage of whichever project the
// app points at (production, or the local stack in end-to-end tests).
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL) : null;

const nextConfig: NextConfig = {
  // Lets the end-to-end build live next to the normal one (e2e uses .next-e2e).
  distDir: process.env.NEXT_DIST_DIR || '.next',

  // cacheComponents: true, // Disabled due to build error in Next 16.0.10
  experimental: {
  },

  // Empty turbopack config to silence warning about PWA webpack config
  turbopack: {},

  images: {
    // Enable modern image formats for better compression
    formats: ['image/avif', 'image/webp'],

    // Optimize for common device sizes
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],

    // End-to-end builds serve images as they are. Under `next start`, the optimizer
    // can hang for good on an image whose first request was cut off, and every
    // later request for that image waits on it, so a `priority` image stops the
    // page's load event. On Vercel, /_next/image is Vercel's own image service.
    unoptimized: process.env.E2E_UNOPTIMIZED_IMAGES === '1',

    remotePatterns: [
      ...(supabaseUrl
        ? [{
          protocol: supabaseUrl.protocol.replace(':', '') as 'http' | 'https',
          hostname: supabaseUrl.hostname,
          port: supabaseUrl.port,
          pathname: '/storage/v1/object/public/**',
        }]
        : []),
      {
        protocol: 'https',
        hostname: 'hdheoblrrnaejqalsmcg.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'www.closetbyera.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
    ],
  },

  // Remove console.logs in production for smaller bundles
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },
};

export default withPWA(nextConfig);

