import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Route files named `page.dev.tsx` (e.g. /dev/ui) only exist in `next dev`.
  // `next build` runs with NODE_ENV=production, so they are never part of a deploy.
  pageExtensions: isDev ? ["dev.tsx", "tsx", "ts"] : ["tsx", "ts"],
  images: {
    formats: ["image/avif", "image/webp"],
    // 90 is for the full-bleed home hero photo (PhotoHero), where 75 showed artifacts.
    qualities: [75, 90],
    // The live Instagram grid on /about. behold.pictures is Behold's CDN, which serves its
    // own permanent copies of each post; Instagram's own scontent.cdninstagram.com URLs
    // expire after a few days and are never used (src/lib/content/behold.ts).
    remotePatterns: [{ protocol: "https", hostname: "behold.pictures" }],
  },
};

export default nextConfig;
