import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Route files named `page.dev.tsx` (e.g. /dev/ui) only exist in `next dev`.
  // `next build` runs with NODE_ENV=production, so they are never part of a deploy.
  pageExtensions: isDev ? ["dev.tsx", "tsx", "ts"] : ["tsx", "ts"],
  images: {
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
