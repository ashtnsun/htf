import { beholdFeedSchema, type BeholdPost, type InstagramTile } from "./schemas";

/**
 * The live Instagram grid on /about.
 *
 * Behold (https://behold.so) is the account's connection to Instagram: it holds the Meta
 * app, refreshes the access token, and republishes each post as JSON plus four image sizes
 * on its own CDN. The site fetches that JSON on the server and draws its own tiles, so the
 * grid keeps the site's language — no Meta embed script, no third-party iframe, nothing
 * cross-origin on the page, and no environment variable (the feed URL is public and lives
 * in content/site.ts).
 *
 * Unlike the loaders in ./index.ts, nothing here throws: this is content someone else's
 * server owns, and an outage or a shape change must never fail the build or blank the
 * section. Every failure returns null and /about falls back to content/instagram.ts.
 */

/** Matches the app's `export const revalidate` in src/app/layout.tsx. */
const REVALIDATE_SECONDS = 3600;

/** A slow third party must not hold a build open. */
const TIMEOUT_MS = 8000;

/** The grid is two rows of three; more tiles would only be cropped out of the layout. */
export const FEED_TILE_COUNT = 6;

/**
 * The image behind a tile. `sizes.medium` (700px) is the largest a tile can use at the
 * grid's widest, and lives on behold.pictures, where URLs are permanent. `thumbnailUrl` is
 * the last resort for a video post with no generated sizes: it points at Instagram's CDN,
 * where URLs expire after a few days, which the hourly revalidate outruns.
 */
function tileSrc(post: BeholdPost): string | null {
  return (
    post.sizes?.medium?.mediaUrl ??
    post.sizes?.large?.mediaUrl ??
    post.sizes?.small?.mediaUrl ??
    post.sizes?.full?.mediaUrl ??
    post.thumbnailUrl ??
    null
  );
}

/** The date an alt-text fallback names, when the timestamp parses. */
function postedOn(timestamp: string | null | undefined): string | null {
  if (!timestamp) return null;
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/**
 * Alt text for one tile. Instagram's own alt text is best but is null on most posts, so the
 * caption stands in — trimmed to one line, since a screen reader reading three paragraphs of
 * hashtag-stripped caption per tile is worse than a short description. A dateless, captionless
 * post still gets a name, because each tile is a link and a link needs one.
 */
function tileAlt(post: BeholdPost, handle: string): string {
  const alt = post.altText?.trim();
  if (alt) return alt;

  const caption = (post.prunedCaption ?? post.caption)?.trim().split("\n")[0]?.trim();
  if (caption) return caption.length > 140 ? `${caption.slice(0, 139).trimEnd()}…` : caption;

  const on = postedOn(post.timestamp);
  return on ? `Instagram post by ${handle}, ${on}` : `Instagram post by ${handle}`;
}

/**
 * Fetches the feed and maps it to tiles, newest first (Behold's own order). Returns null
 * when the feed is unreachable, malformed, or has nothing showable — the caller falls back
 * to the curated grid.
 */
export async function fetchBeholdTiles(
  feedUrl: string,
  handle: string,
  limit: number = FEED_TILE_COUNT,
): Promise<InstagramTile[] | null> {
  let payload: unknown;
  try {
    const response = await fetch(feedUrl, {
      next: { revalidate: REVALIDATE_SECONDS },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) {
      console.warn(`[instagram] Behold feed responded ${response.status}; using the curated grid`);
      return null;
    }
    payload = await response.json();
  } catch (error) {
    console.warn(`[instagram] Behold feed unreachable; using the curated grid`, error);
    return null;
  }

  const parsed = beholdFeedSchema.safeParse(payload);
  if (!parsed.success) {
    console.warn(
      `[instagram] Behold feed did not match the expected shape; using the curated grid`,
    );
    return null;
  }

  const tiles: InstagramTile[] = [];
  for (const post of parsed.data.posts) {
    if (tiles.length === limit) break;
    if (post.visibility && post.visibility !== "visible") continue;
    const src = tileSrc(post);
    if (!src) continue;
    tiles.push({ id: post.id, href: post.permalink, src, alt: tileAlt(post, handle) });
  }

  return tiles.length > 0 ? tiles : null;
}
