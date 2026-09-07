import { OG_CONTENT_TYPE, OG_SIZE, ogImage } from "@/lib/og";

export const alt = "Partner with Hack the Future: bring us a problem, we build the tool.";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return ogImage({
    eyebrow: "For non-profits",
    lines: ["Bring us a problem.", "*We build the tool.*"],
    footer: "A student team scopes it with you, builds it over the school year, hands it off free.",
  });
}
