import { LoaderCircle } from "lucide-react";
import { Children, type ReactNode } from "react";
import { Meander } from "@/components/olympus/Meander";
import { cn } from "@/lib/utils";
import type { ButtonHoverId, ButtonStyleId } from "./store";

/* ------------------------------------------------------------------
   The ten OlympusButton looks. Every ornament is a pixel string map on its own cell grid
   (solid cells, crisp edges, currentColor), so the buttons speak the temple's language.
------------------------------------------------------------------- */

const KEY = ["#####", "#...#", "#.#.#", "#.###", "#....", "#####"];
const COLUMN = [
  "#######",
  ".#####.",
  ".#.#.#.",
  ".#.#.#.",
  ".#.#.#.",
  ".#.#.#.",
  ".#.#.#.",
  ".#.#.#.",
  ".#####.",
  "#######",
];
/** A sprig of laurel, leaves in pairs up the stem. */
const LAUREL = [
  "...#...",
  "..###..",
  "#..#..#",
  "##.#.##",
  ".#####.",
  "#..#..#",
  "##.#.##",
  ".#####.",
  "...#...",
  "...#...",
];
const ALPHA = ["..#..", ".#.#.", "#...#", "#####", "#...#", "#...#"];
const OMEGA = [".###.", "#...#", "#...#", "#...#", ".#.#.", "##.##"];
const WAVE = ["...###..", "..#...#.", "..#.#.#.", ".#..##..", "#.......", "########"];
const DENTIL = ["###.", "###.", "###."];

function Pix({ map, cell = 2, flip = false }: { map: string[]; cell?: number; flip?: boolean }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width={map[0]!.length * cell}
      height={map.length * cell}
      shapeRendering="crispEdges"
      className={cn("shrink-0", flip && "-scale-x-100")}
    >
      {map.flatMap((row, y) =>
        [...row].map((ch, x) =>
          ch === "#" ? (
            <rect
              key={`${x}-${y}`}
              x={x * cell}
              y={y * cell}
              width={cell}
              height={cell}
              fill="currentColor"
            />
          ) : null,
        ),
      )}
    </svg>
  );
}

/** A pixel map repeated across the full width (the dentils, the wave). */
function Strip({ map, cell = 1, id }: { map: string[]; cell?: number; id: string }) {
  const w = map[0]!.length * cell;
  const h = map.length * cell;
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width="100%"
      height={h}
      shapeRendering="crispEdges"
      className="block self-stretch"
    >
      <defs>
        <pattern id={id} width={w} height={h} patternUnits="userSpaceOnUse">
          {map.flatMap((row, y) =>
            [...row].map((ch, x) =>
              ch === "#" ? (
                <rect
                  key={`${x}-${y}`}
                  x={x * cell}
                  y={y * cell}
                  width={cell}
                  height={cell}
                  fill="currentColor"
                />
              ) : null,
            ),
          )}
        </pattern>
      </defs>
      <rect width="100%" height={h} fill={`url(#${id})`} />
    </svg>
  );
}

/**
 * The temple's gable as wide as the button: five courses of 2px, each one stepped in by a
 * tenth of the width on either side, so it reads as a shallow pixel pediment at any width.
 */
function Gable() {
  return (
    <span aria-hidden="true" className="flex w-full flex-col">
      {[4, 3, 2, 1, 0].map((k) => (
        <span key={k} className="block h-[3px] bg-current" style={{ marginInline: `${k * 10}%` }} />
      ))}
    </span>
  );
}

/** The label; the left pad balances the tracking Cinzel leaves after the last letter. */
const Label = ({ children }: { children: ReactNode }) => (
  <span className="pl-[0.25em]">{children}</span>
);
const Spinner = () => <LoaderCircle className="size-3 shrink-0 animate-spin" aria-hidden="true" />;
/** The trailing ornament, or the spinner while the button is busy. */
const End = ({ pending, children }: { pending: boolean; children: ReactNode }) =>
  pending ? <Spinner /> : children;

/** "Ask the Oracle" → "· ASK · THE · ORACLE ·", the way Roman inscriptions part their words. */
function interpunct(children: ReactNode): ReactNode {
  const text = Children.toArray(children).every((c) => typeof c === "string")
    ? Children.toArray(children).join("")
    : null;
  if (text === null) return children;
  return (
    <>
      <span aria-hidden="true" className="text-green">
        ·{" "}
      </span>
      {text.split(/\s+/).map((word, i, all) => (
        <span key={i}>
          {word}
          {i < all.length - 1 ? (
            <span aria-hidden="true" className="text-green">
              {" · "}
            </span>
          ) : null}
        </span>
      ))}
      <span aria-hidden="true" className="text-green">
        {" "}
        ·
      </span>
    </>
  );
}

type Face = { children: ReactNode; pending: boolean; id: string };
type Look = {
  /** The bordered cell around the words; omitted for the unframed looks. */
  frame?: string;
  /** The row inside the frame. */
  row?: string;
  body: (f: Face) => ReactNode;
  above?: (f: Face) => ReactNode;
  below?: (f: Face) => ReactNode;
};

const LOOKS: Record<ButtonStyleId, Look> = {
  key: {
    frame: "border-2",
    row: "gap-3 px-6",
    body: ({ children, pending }) => (
      <>
        <Pix map={KEY} />
        <Label>{children}</Label>
        <End pending={pending}>
          <Pix map={KEY} flip />
        </End>
      </>
    ),
  },
  columns: {
    frame: "border-y-2",
    row: "gap-5 px-1",
    body: ({ children, pending }) => (
      <>
        <Pix map={COLUMN} />
        <Label>{children}</Label>
        <End pending={pending}>
          <Pix map={COLUMN} />
        </End>
      </>
    ),
  },
  pediment: {
    frame: "border-2",
    row: "gap-3 px-7",
    above: () => <Gable />,
    body: ({ children, pending }) => (
      <>
        <Label>{children}</Label>
        {pending ? <Spinner /> : null}
      </>
    ),
  },
  laurel: {
    row: "gap-3 px-2",
    body: ({ children, pending }) => (
      <>
        <Pix map={LAUREL} />
        <Label>{children}</Label>
        <End pending={pending}>
          <Pix map={LAUREL} />
        </End>
      </>
    ),
  },
  stele: {
    frame: "border-y-[6px] border-double bg-surface-2",
    row: "gap-3 px-8",
    body: ({ children, pending }) => (
      <>
        <Label>{children}</Label>
        {pending ? <Spinner /> : null}
      </>
    ),
  },
  band: {
    row: "gap-3 px-4 min-h-10",
    above: () => <Meander cell={2} className="self-stretch" />,
    below: () => <Meander cell={2} className="-scale-y-100 self-stretch" />,
    body: ({ children, pending }) => (
      <>
        <Label>{children}</Label>
        {pending ? <Spinner /> : null}
      </>
    ),
  },
  dentils: {
    frame: "border-2",
    row: "gap-3 px-7",
    above: ({ id }) => (
      <span className="-mb-px block self-stretch px-[2px]">
        <Strip map={DENTIL} cell={2} id={id} />
      </span>
    ),
    body: ({ children, pending }) => (
      <>
        <Label>{children}</Label>
        {pending ? <Spinner /> : null}
      </>
    ),
  },
  interpunct: {
    frame: "border-b-2",
    row: "gap-3 px-1",
    body: ({ children, pending }) => (
      <>
        <Label>{interpunct(children)}</Label>
        {pending ? <Spinner /> : null}
      </>
    ),
  },
  alphaomega: {
    frame: "border-2",
    row: "gap-4 px-5",
    body: ({ children, pending }) => (
      <>
        <Pix map={ALPHA} />
        <Label>{children}</Label>
        <End pending={pending}>
          <Pix map={OMEGA} />
        </End>
      </>
    ),
  },
  wave: {
    row: "gap-3 px-2 min-h-10",
    below: ({ id }) => <Strip map={WAVE} cell={2} id={id} />,
    body: ({ children, pending }) => (
      <>
        <Label>{children}</Label>
        {pending ? <Spinner /> : null}
      </>
    ),
  },
};

const ROW =
  "flex items-center justify-center font-olympus text-sm font-semibold tracking-[0.25em] whitespace-nowrap uppercase";

/**
 * One OlympusButton look, as the button itself or (in the "g" menu's previews) as a plain span.
 * The ornaments sit above and below a frame. The hover is its own setting (`data-hover`, styled
 * in globals.css under "The Olympus button hovers"): primary words never change colour;
 * secondary brightens from muted to white with its ornaments and lines turning green.
 * Nothing moves.
 */
export function ButtonFace({
  look: lookId,
  hover,
  as = "button",
  variant,
  pending,
  id,
  className,
  children,
  ...rest
}: {
  look: ButtonStyleId;
  hover: ButtonHoverId;
  as?: "button" | "span";
  variant: "primary" | "secondary";
  pending: boolean;
  id: string;
  className?: string;
  children: ReactNode;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children" | "className" | "id">) {
  const look = LOOKS[lookId];
  const primary = variant === "primary";
  const face: Face = { children, pending, id };

  const tone = primary
    ? "text-green"
    : "text-muted transition-colors group-hover:text-green group-focus-visible:text-green";
  const words = primary
    ? "text-text"
    : "text-muted transition-colors group-hover:text-text group-focus-visible:text-text";
  const border = primary
    ? "border-green"
    : "border-line-strong transition-colors group-hover:border-green group-focus-visible:border-green";

  const El = as;
  return (
    <El
      {...(as === "button" ? rest : {})}
      data-hover={hover}
      className={cn(
        "ob group relative inline-flex flex-col items-center",
        !look.frame && "ob-box",
        as === "button" &&
          "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-mint",
        className,
      )}
    >
      {look.above ? (
        <span className={cn("ob-orn flex w-0 min-w-full justify-center", tone)}>
          {look.above({ ...face, id: `${id}-a` })}
        </span>
      ) : null}
      <span
        className={cn(
          "relative flex min-h-12 items-stretch self-stretch",
          look.frame && cn("ob-box ob-frame", look.frame, border),
        )}
      >
        <span
          className={cn(
            ROW,
            "ob-row flex-1 [&_svg]:transition-colors",
            look.row,
            words,
            primary ? "[&_svg]:text-green" : "[&_svg]:text-muted group-hover:[&_svg]:text-green",
          )}
        >
          {look.body(face)}
        </span>
      </span>
      {look.below ? (
        <span className={cn("ob-orn flex w-0 min-w-full", tone)}>
          {look.below({ ...face, id: `${id}-b` })}
        </span>
      ) : null}
      {hover === "underline" ? <span aria-hidden="true" className="ob-line" /> : null}
      {hover === "corners" ? <span aria-hidden="true" className="ob-corners" /> : null}
    </El>
  );
}
