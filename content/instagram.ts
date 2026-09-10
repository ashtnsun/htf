import type { InstagramPostInput } from "@/lib/content/schemas";

/**
 * The fallback behind the Instagram grid on /about. When `socials.instagramFeedUrl` in
 * content/site.ts names a Behold feed, the grid draws that account's latest posts instead
 * (src/lib/content/behold.ts) and these are only used if the feed is unreachable; until
 * then they are the grid. To curate one by hand: paste the post URL, drop the image into
 * public/ and point a media key at it in content/media.ts. Tiles whose `href` starts with
 * TODO render without a link.
 */
export const instagramPosts: InstagramPostInput[] = [
  {
    id: "post-1",
    href: "TODO: post URL",
    image: "instagram.post-1",
    alt: "[TODO: describe the post]",
  },
  {
    id: "post-2",
    href: "TODO: post URL",
    image: "instagram.post-2",
    alt: "[TODO: describe the post]",
  },
  {
    id: "post-3",
    href: "TODO: post URL",
    image: "instagram.post-3",
    alt: "[TODO: describe the post]",
  },
  {
    id: "post-4",
    href: "TODO: post URL",
    image: "instagram.post-4",
    alt: "[TODO: describe the post]",
  },
  {
    id: "post-5",
    href: "TODO: post URL",
    image: "instagram.post-5",
    alt: "[TODO: describe the post]",
  },
  {
    id: "post-6",
    href: "TODO: post URL",
    image: "instagram.post-6",
    alt: "[TODO: describe the post]",
  },
];
