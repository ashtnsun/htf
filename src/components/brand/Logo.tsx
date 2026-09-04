import { cn } from "@/lib/utils";
import { LOGO_GLYPHS, LOGO_WIDTH } from "./logo-paths";

const VIEW_TOP = -720;
const VIEW_HEIGHT = 740;

type LogoProps = {
  /** Rendered height in px; width follows the wordmark's aspect ratio. */
  height?: number;
  /** Single-colour version (footer, favicon-like uses). */
  mono?: boolean;
  /** Accessible name. Pass "" when a visible label sits next to it. */
  title?: string;
  className?: string;
};

/**
 * The <HTF/> wordmark as inline SVG, traced from the Cunia outlines used in the
 * brand graphics. Letters are primary green, brackets and slash secondary green.
 */
export function Logo({
  height = 22,
  mono = false,
  title = "Hack the Future",
  className,
}: LogoProps) {
  const width = Math.round((height * LOGO_WIDTH) / VIEW_HEIGHT);
  const decorative = title === "";
  return (
    <svg
      viewBox={`0 ${VIEW_TOP} ${LOGO_WIDTH} ${VIEW_HEIGHT}`}
      width={width}
      height={height}
      role={decorative ? undefined : "img"}
      aria-hidden={decorative ? true : undefined}
      aria-label={decorative ? undefined : title}
      className={cn("block shrink-0", className)}
    >
      <g transform="scale(1,-1)">
        {LOGO_GLYPHS.map((g, i) => (
          <path
            key={i}
            d={g.d}
            className={
              mono ? "fill-current" : g.role === "letter" ? "fill-green" : "fill-green-deep"
            }
          />
        ))}
      </g>
    </svg>
  );
}
