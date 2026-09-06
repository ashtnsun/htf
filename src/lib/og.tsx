import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { site } from "@content/site";
import { LOGO_GLYPHS, LOGO_WIDTH } from "@/components/brand/logo-paths";

/**
 * Shared Open Graph card for the `opengraph-image.tsx` routes: dark canvas, thin grid,
 * green glow, the <HTF/> wordmark, an eyebrow, a display headline and a footer line.
 * Rendered by Satori at build time (no request APIs), so every image is a static PNG.
 *
 * Satori supports flexbox and a CSS subset only: every element with more than one child
 * needs `display: flex`, and a line is either fully green (`*wrapped*`) or not.
 */

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

const COLOR = {
  bg: "#0b0b0b",
  text: "#f5f5f5",
  muted: "#a3a3a3",
  green: "#03c652",
  greenDeep: "#277d4a",
  line: "rgba(255,255,255,0.08)",
};

/* Poppins subset (Latin) generated from the Google Fonts TTFs; OFL.txt sits next to them. */
const FONT_DIR = join(process.cwd(), "src/assets/fonts/poppins");
const [poppinsRegular, poppinsMedium] = await Promise.all([
  readFile(join(FONT_DIR, "Poppins-Regular-latin.ttf")),
  readFile(join(FONT_DIR, "Poppins-Medium-latin.ttf")),
]);

const FONTS = [
  { name: "Poppins", data: poppinsRegular, weight: 400 as const, style: "normal" as const },
  { name: "Poppins", data: poppinsMedium, weight: 500 as const, style: "normal" as const },
];

const LOGO_VIEW_HEIGHT = 740;
/** Width / height of the wordmark. */
export const LOGO_ASPECT = LOGO_WIDTH / LOGO_VIEW_HEIGHT;

/** The <HTF/> wordmark as an SVG data URI: Satori renders <img> SVGs more reliably than inline paths. */
export const LOGO_DATA_URI = (() => {
  const paths = LOGO_GLYPHS.map(
    (g) => `<path d="${g.d}" fill="${g.role === "letter" ? COLOR.green : COLOR.greenDeep}"/>`,
  ).join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -720 ${LOGO_WIDTH} ${LOGO_VIEW_HEIGHT}"><g transform="scale(1,-1)">${paths}</g></svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
})();

export type OgCardProps = {
  /** Small tracked label next to the wordmark ("Students", the nonprofit name). */
  eyebrow: string;
  /** Headline lines. Wrap a whole line in *asterisks* to render it green. */
  lines: string[];
  /** Bottom-left line. Defaults to the site tagline. */
  footer?: string;
  /** lg = two short lines (site, sections). md = longer titles that may wrap (projects). */
  size?: "lg" | "md";
};

function OgCard({ eyebrow, lines, footer = site.tagline, size = "lg" }: OgCardProps) {
  const fontSize = size === "lg" ? 84 : 64;
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "56px 64px 52px",
        background: COLOR.bg,
        color: COLOR.text,
        fontFamily: "Poppins",
        position: "relative",
      }}
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={`c${i}`}
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: `${i * 20}%`,
            width: 1,
            background: COLOR.line,
          }}
        />
      ))}
      {[1, 2].map((i) => (
        <div
          key={`r${i}`}
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: `${i * 33.33}%`,
            height: 1,
            background: COLOR.line,
          }}
        />
      ))}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 380,
          background:
            "radial-gradient(60% 100% at 50% 100%, rgba(3,198,82,0.38) 0%, rgba(3,198,82,0.08) 45%, rgba(3,198,82,0) 75%)",
        }}
      />

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- Satori renders plain <img> */}
        <img src={LOGO_DATA_URI} width={Math.round(44 * LOGO_ASPECT)} height={44} alt="" />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            fontSize: 22,
            fontWeight: 500,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: COLOR.text,
          }}
        >
          <div style={{ width: 10, height: 10, background: COLOR.green }} />
          <div>{eyebrow}</div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: size === "lg" ? 6 : 4,
          maxWidth: 1000,
          fontSize,
          fontWeight: 500,
          lineHeight: 1.05,
          letterSpacing: "-0.03em",
        }}
      >
        {lines.map((line, i) => {
          const accent = /^\*.*\*$/.test(line);
          return (
            <div key={i} style={{ display: "flex", color: accent ? COLOR.green : COLOR.text }}>
              {accent ? line.slice(1, -1) : line}
            </div>
          );
        })}
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          gap: 40,
          fontSize: 24,
          color: COLOR.muted,
        }}
      >
        <div style={{ display: "flex", maxWidth: 820 }}>{footer}</div>
        <div style={{ display: "flex", flexShrink: 0 }}>{site.socials.instagramHandle}</div>
      </div>
    </div>
  );
}

/** Build the PNG response for an opengraph-image route. */
export function ogImage(props: OgCardProps): ImageResponse {
  return new ImageResponse(<OgCard {...props} />, { ...OG_SIZE, fonts: FONTS });
}
