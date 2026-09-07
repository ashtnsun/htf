import { OG_CONTENT_TYPE, OG_SIZE, ogImage } from "@/lib/og";

export const alt = "About Hack the Future: students at Purdue building software for nonprofits.";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return ogImage({
    eyebrow: "About",
    lines: ["Students building", "*for good.*"],
    footer: "A Purdue student organization building software for nonprofits.",
  });
}
