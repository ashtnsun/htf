import { Meander } from "@/components/olympus/Meander";
import { cn } from "@/lib/utils";

/** A Doric column, 11 × 17 cells: abacus, echinus, a fluted shaft (carved cells), the base. */
const COLUMN = [
  "aaaaaaaaaaa",
  ".#########.",
  "..#######..",
  ...Array.from({ length: 12 }, () => "..##.#.##.."),
  ".#########.",
  "###########",
];
const COLUMN_CELLS = COLUMN.flatMap((row, y) =>
  [...row].flatMap((ch, x) => (ch === "." ? [] : [{ x, y, accent: ch === "a" }])),
);

/**
 * The solved words, each standing on its own column, the columns on the Greek key. Every column
 * is drawn from the start (dim until its riddle is solved), so nothing moves as words arrive:
 * the word fades in on top and the column lights up. Pixel art on its grid: 4px cells, 5px from sm.
 */
export function Colonnade({ total, words }: { total: number; words: readonly string[] }) {
  return (
    <section aria-label="Solved" className="w-full">
      <ol
        className="grid items-end"
        style={{ gridTemplateColumns: `repeat(${total}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: total }, (_, i) => {
          const word = words[i];
          return (
            <li key={i} className="flex flex-col items-center">
              <span
                className={cn(
                  "mb-2 h-5 font-olympus text-[clamp(0.6rem,2.6vw,0.9rem)] leading-5 font-semibold tracking-wide whitespace-nowrap uppercase transition-opacity duration-1000 ease-smooth",
                  word ? "opacity-100" : "opacity-0",
                )}
              >
                {word ?? ""}
              </span>
              <svg
                viewBox={`0 0 ${COLUMN[0]!.length} ${COLUMN.length}`}
                className={cn(
                  "block w-11 transition-colors duration-1000 ease-smooth sm:w-[55px]",
                  word ? "text-text" : "text-line-strong",
                )}
                shapeRendering="crispEdges"
                aria-hidden="true"
                focusable="false"
              >
                {COLUMN_CELLS.map(({ x, y, accent }) => (
                  <rect
                    key={`${x}-${y}`}
                    x={x}
                    y={y}
                    width={1}
                    height={1}
                    className={cn(
                      "transition-colors duration-1000 ease-smooth",
                      accent && word ? "fill-green" : "fill-current",
                    )}
                  />
                ))}
              </svg>
            </li>
          );
        })}
      </ol>
      <Meander className="text-green-deep" />
    </section>
  );
}
