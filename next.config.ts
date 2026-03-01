import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
    minimumCacheTTL: 86400,
  },
  headers: async () => [
    {
      // Static assets (JS, CSS, images, fonts) — immutable long cache
      source: '/_next/static/:path*',
      headers: [
        { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
      ],
    },
    {
      // Next.js optimized images
      source: '/_next/image',
      headers: [
        { key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' },
      ],
    },
    {
      // Public assets (logo, etc.)
      source: '/logo.png',
      headers: [
        { key: 'Cache-Control', value: 'public, max-age=604800, immutable' },
      ],
    },
    {
      // OG images — CDN cache 1 day
      source: '/api/og/:path*',
      headers: [
        { key: 'Cache-Control', value: 'public, s-maxage=86400, stale-while-revalidate=604800' },
      ],
    },
    {
      // Sitemaps — CDN cache 1 day
      source: '/api/sitemap/:path*',
      headers: [
        { key: 'Cache-Control', value: 'public, s-maxage=86400, stale-while-revalidate=604800' },
      ],
    },
    {
      // ISR blog pages — profile/tags less frequent changes
      source: '/:username',
      headers: [
        { key: 'Cache-Control', value: 'public, s-maxage=7200, stale-while-revalidate=86400' },
      ],
    },
    {
      // ISR blog post pages
      source: '/:username/:slug',
      headers: [
        { key: 'Cache-Control', value: 'public, s-maxage=3600, stale-while-revalidate=86400' },
      ],
    },
    {
      // ISR tag pages
      source: '/:username/tags/:tag',
      headers: [
        { key: 'Cache-Control', value: 'public, s-maxage=7200, stale-while-revalidate=86400' },
      ],
    },
    {
      // Homepage — static, long cache
      source: '/',
      headers: [
        { key: 'Cache-Control', value: 'public, s-maxage=86400, stale-while-revalidate=604800' },
      ],
    },
  ],
};

export default nextConfig;
