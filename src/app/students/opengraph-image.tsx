import { OG_CONTENT_TYPE, OG_SIZE, ogImage } from "@/lib/og";

export const alt = "Join Hack the Future at Purdue as a project lead, developer or designer.";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return ogImage({
    eyebrow: "Students",
    lines: ["Join us to make", "*an impact.*"],
    footer: "Project leads, developers and designers. Open to all majors, all years.",
  });
}
