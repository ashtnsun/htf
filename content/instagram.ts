import type { InstagramPostInput } from "@/lib/content/schemas";

/**
 * Curated Instagram posts for the grid on /about. There is no API involved (an official
 * embed needs a Meta app, see docs/PLAN.md): paste the post URL, drop the image into
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
