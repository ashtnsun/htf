import { cn } from "@/lib/utils";

/**
 * The herald's wax seal (step V): a blob of wax with drips past its round, a pressed rim, the
 * Greek key stamped in its face, shade along its lower right and a glint at its upper left.
 * Solid cells and crisp edges like the site's other pixel art.
 *
 * `o` wax, `d` pressed into the wax (the rim and the key), `s` the wax's shaded edge, `w` the
 * glint. Mono (the printed letters) draws wax, shade and glint in `currentColor` and leaves the
 * pressed cells as paper.
 */
const SEAL = [
  "..........ooo........",
  "........oooooooo.....",
  ".....owoooooooooo....",
  "....owoodddddooooo...",
  "...owoddoooooddoooo..",
  "..owodooooooooodooo..",
  "..oodooooooooooodos..",
  "..oodoodddddddoodos..",
  ".oodooooooooodooodos.",
  "ooodooodddddodooodos.",
  "ooodooodooododooodos.",
  "ooodooododddodooodos.",
  ".oodooodooooodooodos.",
  "..oodoodddddddoodos..",
  "..oodooooooooooodos..",
  "..ooodooooooooodoos..",
  "...oooddoooooddoos...",
  "....oooodddddooos....",
  ".....ossoooooooss....",
  "........ssssos.......",
  "...........ss........",
];

const SIZE = SEAL.length;

/** Where the seal cracks: one column per row, a jagged line down the middle. */
const CRACK = [10, 10, 11, 11, 10, 9, 9, 10, 11, 11, 10, 10, 9, 9, 10, 11, 11, 10, 10, 9, 9];

/** How far each half moves apart when the seal breaks, in cells. */
const APART = 1;

type Half = "left" | "right";

function paths(half: Half, broken: boolean) {
  const out: Record<string, string> = { o: "", d: "", s: "", w: "" };
  SEAL.forEach((row, y) =>
    [...row].forEach((ch, x) => {
      if (ch === ".") return;
      const crack = CRACK[y]!;
      if (broken && x === crack) return;
      if ((half === "left") !== x <= crack) return;
      out[ch] += `M${x} ${y}h1v1h-1z`;
    }),
  );
  return out;
}

const WHOLE = { left: paths("left", false), right: paths("right", false) };
const BROKEN = { left: paths("left", true), right: paths("right", true) };

export function Seal({
  cell = 8,
  mono = false,
  broken = false,
  className,
}: {
  cell?: number;
  /** One ink, for print: wax, shade and glint solid, pressed cells left as paper. */
  mono?: boolean;
  /** Cracked down the middle, its halves stepped apart. */
  broken?: boolean;
  className?: string;
}) {
  const parts = broken ? BROKEN : WHOLE;
  const width = SIZE + APART * 2;
  return (
    <svg
      aria-hidden="true"
      width={width * cell}
      height={SIZE * cell}
      viewBox={`${-APART} 0 ${width} ${SIZE}`}
      shapeRendering="crispEdges"
      className={cn("seal", className)}
    >
      {(["left", "right"] as const).map((half) => (
        <g
          key={half}
          className="seal-half"
          style={{
            transform: broken ? `translateX(${half === "left" ? -APART : APART}px)` : undefined,
          }}
        >
          <path d={parts[half].o} fill="var(--seal-wax, currentColor)" />
          <path d={parts[half].s} fill={mono ? "currentColor" : "var(--seal-shade)"} />
          <path d={parts[half].w} fill={mono ? "currentColor" : "var(--seal-glint)"} />
          {mono ? null : <path d={parts[half].d} fill="var(--seal-shade)" />}
        </g>
      ))}
    </svg>
  );
}
