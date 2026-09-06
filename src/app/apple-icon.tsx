import { ImageResponse } from "next/og";
import { LOGO_ASPECT, LOGO_DATA_URI } from "@/lib/og";

/** 180px PNG home-screen icon (iOS ignores SVG favicons): the wordmark on the dark canvas. */
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function Icon() {
  const width = 150;
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
      <img src={LOGO_DATA_URI} width={width} height={Math.round(width / LOGO_ASPECT)} alt="" />
    </div>,
    size,
  );
}
