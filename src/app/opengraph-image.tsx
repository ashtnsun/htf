import { OG_CONTENT_TYPE, OG_SIZE, ogImage } from "@/lib/og";

/** Default share image for every route without its own opengraph-image. */
export const alt = "Hack the Future: building software for nonprofits, at Purdue.";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return ogImage({
    eyebrow: "Student Org @ Purdue University",
    lines: ["Building software for", "*nonprofits, at Purdue.*"],
  });
}
