import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

type RemotePattern = Exclude<
  NonNullable<NextConfig["images"]>["remotePatterns"],
  undefined
>[number];

/** Portfolio Night's screenshots, served from the Supabase bucket (src/lib/portfolio/db.ts). */
function supabaseShots(): RemotePattern[] {
  if (!process.env.SUPABASE_URL) return [];
  const { protocol, hostname, port } = new URL(process.env.SUPABASE_URL);
  return [
    {
      protocol: protocol === "http:" ? "http" : "https",
      hostname,
      port,
      // The query string is the recapture cache-buster (?v=…), so `search` stays open.
      pathname: "/storage/v1/object/public/portfolio-shots/**",
    },
  ];
}

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
    remotePatterns: [{ protocol: "https", hostname: "behold.pictures" }, ...supabaseShots()],
    // The local Supabase stack runs on 127.0.0.1, which Next refuses to optimise from by default.
    dangerouslyAllowLocalIP: isDev,
  },
};

export default nextConfig;
