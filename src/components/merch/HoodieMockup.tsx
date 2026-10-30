"use client";

import { useId, type ReactNode, type Ref } from "react";
import { DINO_PIXELS } from "@/components/brand/dino-pixels";
import { LOGO_GLYPHS, LOGO_WIDTH } from "@/components/brand/logo-paths";
import { INKS, ZIPPERS, fabric, mix, type Design } from "./design";
import {
  ARMHOLE,
  BODY_BACK,
  BODY_FOLDS,
  BODY_FRONT,
  CENTRE_X,
  CHEST_DINO,
  CLOSE_UP,
  CORD,
  CORD_TIP,
  CUFF,
  CUFF_TAG,
  BACK_ART,
  HEM,
  HEM_TAB,
  HOOD_BACK,
  HOOD_BAND,
  HOOD_SEAM,
  HOOD_WALL,
  MIRROR,
  POCKET_OPENING,
  POCKET_TOP,
  SLEEVE,
  SLEEVE_FOLDS,
  SLEEVE_FRAME,
  VIEW_H,
  VIEW_W,
} from "./garment";
import type { ArtPiece } from "./sigil";

export type MockupView = "front" | "back";

/** The dinosaur as one path of unit cells, for the chest, the zipper pull and the back. */
const DINO_D = DINO_PIXELS.flatMap((row, y) =>
  Array.from(row).flatMap((c, x) => (c === "#" ? [`M${x} ${y}h1v1h-1z`] : [])),
).join("");
const DINO_W = DINO_PIXELS[0]!.length;
const DINO_H = DINO_PIXELS.length;

/** The art for a mockup: each sleeve (in the sleeve's frame) and the back (garment frame). */
export type MockupArt = { left: ArtPiece | null; right: ArtPiece | null; back: ArtPiece | null };

/**
 * A photographic mockup of the zip-up, front or back, as one SVG: the garment pieces in
 * washed black, the print (warped by the fabric, worn by the distress and finished by the
 * technique: flat ink, a raised puff with a highlight, stitched thread or a soft discharge),
 * folds, seams, mottling and grain over everything, then the hardware on top. Pure SVG with
 * filters, so the PNG export is the same drawing rasterised.
 */
export function HoodieMockup({
  design,
  art,
  view,
  closeUp = false,
  ref,
  className,
}: {
  design: Design;
  art: MockupArt;
  view: MockupView;
  closeUp?: boolean;
  ref?: Ref<SVGSVGElement>;
  className?: string;
}) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const id = (n: string) => `${uid}-${n}`;
  const url = (n: string) => `url(#${id(n)})`;
  const fab = fabric(design.wash);
  const front = view === "front";
  const metal = ZIPPERS[design.zipper].hex;
  const markFill = design.markInk === "tonal" ? fab.tonal : INKS[design.accent].hex;
  const light = design.backdrop === "light";

  /** A piece: its masks tinted with the two inks, then printed (warped, worn, finished). */
  const print = (p: ArtPiece | null) =>
    p ? (
      <g filter={url("print")}>
        <image
          href={p.fill}
          x={p.box.x}
          y={p.box.y}
          width={p.box.w}
          height={p.box.h}
          preserveAspectRatio="none"
          filter={url("tint-primary")}
        />
        {p.inline ? (
          <image
            href={p.inline}
            x={p.box.x}
            y={p.box.y}
            width={p.box.w}
            height={p.box.h}
            preserveAspectRatio="none"
            filter={url("tint-accent")}
          />
        ) : null}
      </g>
    ) : null;

  // Wearer's left is the viewer's left from the back and the viewer's right from the front.
  const wearerLeft = front ? MIRROR : undefined;
  const sleevePrint = (p: ArtPiece | null) => (
    <g clipPath={url("sleeve")}>
      <g transform={`translate(${SLEEVE_FRAME.x} ${SLEEVE_FRAME.y}) rotate(${SLEEVE_FRAME.angle})`}>
        {print(p)}
      </g>
    </g>
  );

  const t = 0.16 + design.distress * 0.42;
  const region = {
    filterUnits: "userSpaceOnUse" as const,
    x: -1500,
    y: -1500,
    width: 4000,
    height: 4200,
  };

  const folds = (set: { dark: string[]; light: string[] }) => (
    <>
      <g filter={url("blur-m")} stroke="#000" strokeWidth={16} fill="none" opacity={0.5}>
        {set.dark.map((d) => (
          <path key={d} d={d} />
        ))}
      </g>
      <g
        filter={url("blur-m")}
        stroke="#fff"
        strokeWidth={12}
        fill="none"
        opacity={0.06 + design.wash * 0.05}
      >
        {set.light.map((d) => (
          <path key={d} d={d} />
        ))}
      </g>
    </>
  );
  /** Darkens a piece toward its edges so it reads round. */
  const edge = (d: string, clip: string, w = 70, o = 0.55) => (
    <path
      d={d}
      fill="none"
      stroke="#000"
      strokeWidth={w}
      opacity={o}
      filter={url("blur-m")}
      clipPath={url(clip)}
    />
  );
  const seam = (d: string, key?: string) => (
    <g key={key} fill="none">
      <path d={d} stroke="#000" strokeWidth={4} opacity={0.35} filter={url("blur-xs")} />
      <path d={d} stroke={fab.seam} strokeWidth={1.6} opacity={0.8} />
    </g>
  );
  const stitch = (d: string, transform?: string) => (
    <path
      d={d}
      transform={transform}
      fill="none"
      stroke={fab.seam}
      strokeWidth={1.1}
      strokeDasharray="4 3"
      opacity={0.7}
    />
  );
  const both = (node: (side: "l" | "r") => ReactNode) => (
    <>
      <g>{node("l")}</g>
      <g transform={MIRROR}>{node("r")}</g>
    </>
  );
  const silhouette = (fill: string) => (
    <g fill={fill}>
      <path d={front ? BODY_FRONT : BODY_BACK} />
      <path d={HEM} />
      {front ? <path d={HOOD_WALL} /> : <path d={HOOD_BACK} />}
      {both(() => (
        <>
          <path d={SLEEVE} />
          <path d={CUFF} />
        </>
      ))}
    </g>
  );
  const logo = (x: number, baseline: number, width: number, fill: string, transform?: string) => {
    const s = width / LOGO_WIDTH;
    return (
      <g transform={transform}>
        <g transform={`translate(${x} ${baseline}) scale(${s} ${-s})`} fill={fill}>
          {LOGO_GLYPHS.map((g, i) => (
            <path key={i} d={g.d} />
          ))}
        </g>
      </g>
    );
  };

  return (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      viewBox={closeUp ? CLOSE_UP : `0 0 ${VIEW_W} ${VIEW_H}`}
      className={className}
      role="img"
      aria-label={`Mockup of the zip-up hoodie, ${closeUp ? "close-up of the left shoulder" : view}`}
    >
      <defs>
        <radialGradient id={id("backdrop")} cx="50%" cy="42%" r="75%">
          <stop offset="0" stopColor={light ? "#E2E0DB" : "#232323"} />
          <stop offset="1" stopColor={light ? "#B4B1AB" : "#0A0A0A"} />
        </radialGradient>
        <linearGradient id={id("light")} x1="0" y1="0" x2="0.35" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity={0.09} />
          <stop offset="0.45" stopColor="#fff" stopOpacity={0} />
          <stop offset="1" stopColor="#000" stopOpacity={0.4} />
        </linearGradient>
        <radialGradient id={id("inside")} cx="50%" cy="78%" r="60%">
          <stop offset="0" stopColor="#000" stopOpacity={0.85} />
          <stop offset="1" stopColor="#000" stopOpacity={0.2} />
        </radialGradient>
        <linearGradient id={id("metal")} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={mix(metal, "#000000", 0.35)} />
          <stop offset="0.45" stopColor={mix(metal, "#ffffff", 0.35)} />
          <stop offset="1" stopColor={mix(metal, "#000000", 0.25)} />
        </linearGradient>
        <pattern id={id("rib")} width="7" height="40" patternUnits="userSpaceOnUse">
          <rect width="3" height="40" fill="#000" opacity="0.3" />
          <rect x="3" width="1" height="40" fill="#fff" opacity="0.05" />
        </pattern>
        <pattern
          id={id("teeth")}
          width="9"
          height="7"
          patternUnits="userSpaceOnUse"
          x="495.5"
          y="268"
        >
          <rect width="5" height="3.4" fill={metal} />
          <rect x="4" y="3.5" width="5" height="3.4" fill={mix(metal, "#000000", 0.25)} />
        </pattern>

        {(["xs", "s", "m", "l"] as const).map((k, i) => (
          <filter key={k} id={id(`blur-${k}`)} {...region}>
            <feGaussianBlur stdDeviation={[1.2, 5, 12, 24][i]} />
          </filter>
        ))}
        {(["primary", "accent"] as const).map((k) => (
          <filter key={k} id={id(`tint-${k}`)} colorInterpolationFilters="sRGB">
            <feFlood floodColor={INKS[design[k]].hex} />
            <feComposite in2="SourceGraphic" operator="in" />
          </filter>
        ))}
        <filter id={id("mottle")} {...region}>
          <feTurbulence type="fractalNoise" baseFrequency="0.016 0.0045" numOctaves={4} seed={11} />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 0.96  2.8 0 0 0 -1.25"
          />
        </filter>
        <filter id={id("blotch")} {...region}>
          <feTurbulence type="fractalNoise" baseFrequency="0.011 0.006" numOctaves={3} seed={29} />
          <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 2.6 0 0 -1.2" />
        </filter>
        <filter id={id("grain")} {...region}>
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={4} />
          <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  1.5 0 0 0 -0.62" />
        </filter>
        <filter id={id("print")} {...region}>
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.016"
            numOctaves={2}
            seed={3}
            result="warp"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="warp"
            scale={6}
            xChannelSelector="R"
            yChannelSelector="G"
            result="ink"
          />
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.32"
            numOctaves={3}
            seed={9}
            result="noise"
          />
          <feColorMatrix
            in="noise"
            type="matrix"
            values={`0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  14 0 0 0 ${0.5 - 14 * t}`}
            result="mask"
          />
          <feComposite in="ink" in2="mask" operator="in" result="worn" />
          {design.technique === "screen" ? (
            <feComponentTransfer in="worn">
              <feFuncA type="linear" slope={0.95} />
            </feComponentTransfer>
          ) : design.technique === "discharge" ? (
            <>
              <feGaussianBlur in="worn" stdDeviation={0.6} result="soft" />
              <feComponentTransfer in="soft">
                <feFuncA type="linear" slope={0.7} />
              </feComponentTransfer>
            </>
          ) : (
            <>
              <feGaussianBlur
                in="worn"
                stdDeviation={design.technique === "puff" ? 1.6 : 0.9}
                result="bump"
              />
              <feSpecularLighting
                in="bump"
                surfaceScale={design.technique === "puff" ? 3.2 : 1.6}
                specularConstant={design.technique === "puff" ? 0.85 : 0.6}
                specularExponent={18}
                lightingColor="#ffffff"
                result="spec"
              >
                <feDistantLight azimuth={235} elevation={38} />
              </feSpecularLighting>
              <feComposite in="spec" in2="worn" operator="in" result="specIn" />
              <feComponentTransfer in="specIn" result="shine">
                <feFuncA type="linear" slope={design.technique === "puff" ? 0.5 : 0.35} />
              </feComponentTransfer>
              <feColorMatrix
                in="worn"
                type="matrix"
                values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.75 0"
                result="sh0"
              />
              <feOffset
                in="sh0"
                dx={1.2}
                dy={design.technique === "puff" ? 2.4 : 1.4}
                result="sh1"
              />
              <feGaussianBlur in="sh1" stdDeviation={1.6} result="shadow" />
              {design.technique === "embroidery" ? (
                <>
                  <feTurbulence
                    type="fractalNoise"
                    baseFrequency="0.04 0.9"
                    numOctaves={2}
                    seed={5}
                    result="thread"
                  />
                  <feColorMatrix
                    in="thread"
                    type="matrix"
                    values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 2.2 0 0 -0.95"
                    result="threadDark"
                  />
                  <feComposite in="threadDark" in2="worn" operator="in" result="threads" />
                </>
              ) : null}
              <feMerge>
                <feMergeNode in="shadow" />
                <feMergeNode in="worn" />
                {design.technique === "embroidery" ? <feMergeNode in="threads" /> : null}
                <feMergeNode in="shine" />
              </feMerge>
            </>
          )}
        </filter>
        <filter id={id("stitched")} {...region}>
          <feGaussianBlur in="SourceAlpha" stdDeviation={0.5} result="bump" />
          <feSpecularLighting
            in="bump"
            surfaceScale={1.5}
            specularConstant={0.7}
            specularExponent={16}
            lightingColor="#ffffff"
            result="spec"
          >
            <feDistantLight azimuth={235} elevation={40} />
          </feSpecularLighting>
          <feComposite in="spec" in2="SourceAlpha" operator="in" result="specIn" />
          <feComponentTransfer in="specIn" result="shine">
            <feFuncA type="linear" slope={0.4} />
          </feComponentTransfer>
          <feOffset in="SourceAlpha" dx={0.6} dy={1} result="o" />
          <feGaussianBlur in="o" stdDeviation={0.8} result="shadow" />
          <feComponentTransfer in="shadow" result="shadowSoft">
            <feFuncA type="linear" slope={0.7} />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode in="shadowSoft" />
            <feMergeNode in="SourceGraphic" />
            <feMergeNode in="shine" />
          </feMerge>
        </filter>

        <clipPath id={id("body")}>
          <path d={front ? BODY_FRONT : BODY_BACK} />
          <path d={HEM} />
        </clipPath>
        <clipPath id={id("sleeve")}>
          <path d={SLEEVE} />
        </clipPath>
        <clipPath id={id("cuff")}>
          <path d={CUFF} />
        </clipPath>
        <clipPath id={id("hem")}>
          <path d={HEM} />
        </clipPath>
        <clipPath id={id("hood")}>
          <path d={front ? HOOD_BAND : HOOD_BACK} />
        </clipPath>
        <clipPath id={id("wall")}>
          <path d={HOOD_WALL} />
        </clipPath>
        <clipPath id={id("garment")}>
          <path d={front ? BODY_FRONT : BODY_BACK} />
          <path d={HEM} />
          <path d={front ? HOOD_WALL : HOOD_BACK} />
          <path d={SLEEVE} />
          <path d={CUFF} />
          <path d={SLEEVE} transform={MIRROR} />
          <path d={CUFF} transform={MIRROR} />
          {front ? (
            <>
              <path d={HOOD_BAND} />
              <path d={HOOD_BAND} transform={MIRROR} />
            </>
          ) : null}
        </clipPath>
      </defs>

      {/* Backdrop and the shadow the garment casts on it. */}
      <rect width={VIEW_W} height={VIEW_H} fill={url("backdrop")} />
      <g transform="translate(0 18)" opacity={light ? 0.38 : 0.7} filter={url("blur-l")}>
        {silhouette("#000")}
      </g>

      {/* Inside of the hood, seen behind the neck from the front. */}
      {front ? (
        <g>
          <path d={HOOD_WALL} fill={fab.lining} />
          <path d={HOOD_WALL} fill={url("inside")} />
          {edge(HOOD_WALL, "wall", 40, 0.5)}
          <path
            d="M500 104C501 160 500 220 500 270"
            stroke="#000"
            strokeWidth={6}
            opacity={0.4}
            filter={url("blur-xs")}
            fill="none"
          />
        </g>
      ) : null}

      {/* Body, its print (the back piece), folds and edge shading. */}
      <path d={front ? BODY_FRONT : BODY_BACK} fill={fab.base} />
      {!front && art.back ? (
        <g clipPath={url("body")}>
          {print(art.back)}
          {design.marks.pendant ? (
            <path
              d={DINO_D}
              transform={`translate(${CENTRE_X - (DINO_W * 1.6) / 2} ${BACK_ART.top + 44 - (DINO_H * 1.6) / 2}) scale(1.6)`}
              fill={markFill}
              shapeRendering="crispEdges"
              filter={url("stitched")}
            />
          ) : null}
        </g>
      ) : null}
      <g clipPath={url("body")}>
        {both(() => folds(BODY_FOLDS))}
        {front ? (
          <>
            {/* The zipper's shadow and the pockets' openings. */}
            <path
              d="M500 262V1000"
              stroke="#000"
              strokeWidth={30}
              opacity={0.45}
              filter={url("blur-s")}
            />
            {both(() => (
              <>
                <path
                  d={POCKET_OPENING}
                  transform="translate(-5 0)"
                  stroke="#000"
                  strokeWidth={12}
                  fill="none"
                  opacity={0.75}
                  filter={url("blur-s")}
                />
                <path
                  d={POCKET_OPENING}
                  transform="translate(3 0)"
                  stroke="#fff"
                  strokeWidth={2}
                  fill="none"
                  opacity={0.07}
                />
              </>
            ))}
          </>
        ) : null}
      </g>
      {edge(front ? BODY_FRONT : BODY_BACK, "body")}
      {front && design.marks.chest ? (
        <path
          d={DINO_D}
          transform={`translate(${CHEST_DINO.x} ${CHEST_DINO.y}) scale(${CHEST_DINO.cell})`}
          fill={markFill}
          shapeRendering="crispEdges"
          filter={url("stitched")}
        />
      ) : null}

      {/* Hem rib. */}
      <path d={HEM} fill={fab.base} />
      <path d={HEM} fill={url("rib")} />
      {edge(HEM, "hem", 40, 0.45)}
      <path
        d="M268 998L732 998"
        stroke="#000"
        strokeWidth={14}
        opacity={0.5}
        filter={url("blur-s")}
        clipPath={url("hem")}
      />

      {/* The sleeves' shadow on the body, then the sleeves and cuffs. */}
      <g clipPath={url("body")} opacity={0.55} filter={url("blur-s")}>
        {both(() => (
          <path d={SLEEVE} transform="translate(10 6)" fill="#000" />
        ))}
      </g>
      {both((side) => (
        <>
          <path d={SLEEVE} fill={fab.base} />
          {sleevePrint(
            front ? (side === "l" ? art.right : art.left) : side === "l" ? art.left : art.right,
          )}
          <g clipPath={url("sleeve")}>{folds(SLEEVE_FOLDS)}</g>
          {edge(SLEEVE, "sleeve", 60, 0.5)}
          <path d={CUFF} fill={fab.base} />
          <path d={CUFF} fill={url("rib")} />
          {edge(CUFF, "cuff", 30, 0.45)}
          <path
            d="M106 868L202 868"
            stroke="#000"
            strokeWidth={10}
            opacity={0.5}
            filter={url("blur-s")}
            clipPath={url("cuff")}
          />
        </>
      ))}

      {/* The hood: lying on the back, or its edge bands from the front. */}
      {front ? (
        both(() => (
          <>
            <path
              d={HOOD_BAND}
              transform="translate(2 5)"
              fill="#000"
              opacity={0.6}
              filter={url("blur-s")}
            />
            <path d={HOOD_BAND} fill={fab.base} />
            {edge(HOOD_BAND, "hood", 14, 0.5)}
          </>
        ))
      ) : (
        <>
          <path
            d={HOOD_BACK}
            transform="translate(0 12)"
            fill="#000"
            opacity={0.65}
            filter={url("blur-m")}
            clipPath={url("body")}
          />
          <path d={HOOD_BACK} fill={fab.base} />
          <g clipPath={url("hood")}>
            {both(() =>
              folds({
                dark: ["M332 262C342 342 372 420 422 472", "M372 182C420 172 460 170 494 172"],
                light: ["M352 232C358 302 382 380 432 440"],
              }),
            )}
          </g>
          {edge(HOOD_BACK, "hood", 50, 0.55)}
          {/* The hood's folded edge catches the light. */}
          <path d={HOOD_BACK} fill="none" stroke={fab.seam} strokeWidth={2} opacity={0.55} />
        </>
      )}

      {/* The wash: mottling, darker blotches and grain over the whole garment, print included. */}
      <g clipPath={url("garment")}>
        <rect
          width={VIEW_W}
          height={VIEW_H}
          filter={url("mottle")}
          opacity={0.03 + design.wash * 0.09}
        />
        <rect
          width={VIEW_W}
          height={VIEW_H}
          filter={url("blotch")}
          opacity={0.1 + design.wash * 0.12}
        />
        <rect
          width={VIEW_W}
          height={VIEW_H}
          filter={url("grain")}
          opacity={0.05 + design.wash * 0.05}
        />
        <rect width={VIEW_W} height={VIEW_H} fill={url("light")} />
      </g>

      {/* Seams and topstitching. */}
      {both(() => (
        <>
          {seam(ARMHOLE)}
          {stitch(ARMHOLE, "translate(6 -3)")}
          {seam("M108 868L200 868")}
        </>
      ))}
      {seam("M268 998L732 998")}
      {front ? (
        both(() => (
          <>
            {stitch(POCKET_OPENING, "translate(7 0)")}
            {stitch(POCKET_TOP)}
            {seam("M386 180C394 222 432 250 497 258")}
          </>
        ))
      ) : (
        <>
          {seam(HOOD_SEAM)}
          {stitch(HOOD_SEAM, "translate(5 0)")}
          {stitch(HOOD_SEAM, "translate(-5 0)")}
        </>
      )}

      {/* HTF tags: a woven cuff tag and a hem tab, both on the wearer's left. */}
      {design.marks.cuff ? (
        <g transform={wearerLeft}>
          <rect
            x={CUFF_TAG.x}
            y={CUFF_TAG.y}
            width={CUFF_TAG.w}
            height={CUFF_TAG.h}
            fill="#0C0C0C"
            filter={url("stitched")}
          />
          {logo(
            CUFF_TAG.x + 5,
            CUFF_TAG.y + CUFF_TAG.h - 3.6,
            CUFF_TAG.w - 10,
            markFill === fab.tonal ? "#6E6D69" : markFill,
          )}
        </g>
      ) : null}
      {design.marks.hem ? (
        <g transform={wearerLeft}>
          <rect
            x={HEM_TAB.x}
            y={HEM_TAB.y}
            width={HEM_TAB.w}
            height={HEM_TAB.h}
            fill="#0C0C0C"
            filter={url("stitched")}
          />
          {logo(
            0,
            0,
            HEM_TAB.h - 8,
            markFill === fab.tonal ? "#6E6D69" : markFill,
            `translate(${HEM_TAB.x + 8} ${HEM_TAB.y + HEM_TAB.h - 4}) rotate(-90)`,
          )}
        </g>
      ) : null}

      {/* Front hardware: zipper, drawcords. */}
      {front ? (
        <g>
          <rect x={489} y={262} width={22} height={818} fill={mix(fab.base, "#000000", 0.5)} />
          <rect x={495.5} y={268} width={9} height={800} fill={url("teeth")} />
          <rect x={491} y={1064} width={18} height={14} fill={url("metal")} />
          <path d="M490 266L510 266L507 300L493 300Z" fill={url("metal")} />
          {design.marks.pull ? (
            <g>
              <rect x={492} y={296} width={16} height={44} rx={2} fill={url("metal")} />
              <rect
                x={492}
                y={296}
                width={16}
                height={44}
                rx={2}
                fill="none"
                stroke="#000"
                strokeOpacity={0.4}
              />
              <path
                d={DINO_D}
                transform="translate(494.5 314) scale(0.55)"
                fill={mix(metal, "#000000", 0.45)}
                shapeRendering="crispEdges"
              />
            </g>
          ) : (
            <g>
              <rect x={495} y={296} width={10} height={40} rx={2} fill={url("metal")} />
              <rect x={497.5} y={326} width={5} height={6} fill="#000" opacity={0.5} />
            </g>
          )}
          {design.cords !== "none"
            ? both(() => (
                <>
                  <circle
                    cx={464}
                    cy={262}
                    r={6}
                    fill="none"
                    stroke={url("metal")}
                    strokeWidth={3}
                  />
                  <path
                    d={CORD}
                    transform="translate(3 4)"
                    stroke="#000"
                    strokeWidth={8}
                    fill="none"
                    opacity={0.5}
                    filter={url("blur-xs")}
                  />
                  <path
                    d={CORD}
                    stroke={
                      design.cords === "green" ? INKS.green.hex : mix(fab.base, "#000000", 0.15)
                    }
                    strokeWidth={7}
                    strokeLinecap="round"
                    fill="none"
                  />
                  <path
                    d={CORD}
                    transform="translate(-1.5 0)"
                    stroke="#fff"
                    strokeWidth={1.2}
                    fill="none"
                    opacity={0.12}
                  />
                  <path
                    d={CORD_TIP}
                    stroke={url("metal")}
                    strokeWidth={7.5}
                    strokeLinecap="round"
                  />
                </>
              ))
            : null}
        </g>
      ) : null}
    </svg>
  );
}
