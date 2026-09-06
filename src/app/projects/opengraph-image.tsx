import { OG_CONTENT_TYPE, OG_SIZE, ogImage } from "@/lib/og";

export const alt = "Projects by Hack the Future for nonprofit partners.";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return ogImage({
    eyebrow: "Projects",
    lines: ["Software built for", "*nonprofits.*"],
    footer: "One student team and one organization at a time.",
  });
}
