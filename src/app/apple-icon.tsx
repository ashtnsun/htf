import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

/**
 * 180px PNG home-screen icon (iOS ignores SVG favicons): the same generated pixel T-rex as
 * the favicon, inset so iOS's rounded mask cannot clip the tail or the feet. Satori renders
 * an <img> SVG more reliably than inline shapes, so the file is embedded as a data URI.
 */
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

const icon = await readFile(join(process.cwd(), "src/app/icon.svg"), "utf8");
const ICON_DATA_URI = `data:image/svg+xml;base64,${Buffer.from(icon).toString("base64")}`;

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0b0b0b",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- Satori renders plain <img> */}
      <img src={ICON_DATA_URI} width={148} height={148} alt="" />
    </div>,
    size,
  );
}
