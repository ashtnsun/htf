import { landed, type LandedCompany } from "@content/landed";

/** Fills dark enough to disappear into the page without an edge. */
const DARK = new Set([
  "#1F1F1F",
  "#2A2A2A",
  "#000000",
  "#0B1F3F",
  "#00095B",
  "#232F3E",
  "#101113",
  "#2E2E38",
]);
import { Reveal } from "@/components/motion/Reveal";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Headline } from "@/components/ui/Headline";
import { Media } from "@/components/ui/Media";
import { Section } from "@/components/ui/Section";
import { cn } from "@/lib/utils";

/** The logo's size inside its bubble: wordmarks wide, symbols square, times the company's scale. */
function box({ wide, scale = 1 }: LandedCompany) {
  return wide
    ? { width: `${86 * scale}%`, height: `${44 * scale}%` }
    : { width: `${58 * scale}%`, height: `${58 * scale}%` };
}

/** Three rows, the middle one wider, each nesting half a bubble into the one above: a honeycomb. */
function toRows<T>(all: T[]) {
  const items = [...all];
  const rows: T[][] = [];
  // three rows, the middle one two bubbles wider than its neighbours
  const n = items.length;
  const mid = Math.ceil((n + 2) / 3);
  const top = Math.ceil((n - mid) / 2);
  for (const size of [top, mid, n - mid - top]) {
    rows.push(items.splice(0, size));
  }
  return rows;
}

/**
 * "Where we land?": the companies members have gone on to, as a honeycomb of equal round bubbles
 * in each company's colour (content/landed.ts has the logos and fills).
 */
export function WhereWeLand() {
  return (
    <Section id="landed" aria-labelledby="landed-title" className="border-t border-line">
      <Reveal standalone>
        <Eyebrow>Where we land</Eyebrow>
        <Headline
          as="h2"
          id="landed-title"
          size="h2"
          lines={["Where we *land?*"]}
          className="mt-5"
        />
        <p className="mt-6 max-w-xl text-body-lg text-muted">
          Members in the club have gone on to land offers from the following companies:
        </p>
      </Reveal>
      <ul
        aria-label="Companies"
        // the middle row of twelve spans the container; the shorter rows nest inside it
        className="mt-12 flex flex-col items-center gap-y-2 [--gap:0.5rem] [--tile:calc((100%_-_5*var(--gap))/6)] md:mt-16 md:gap-y-3 md:[--gap:0.75rem] md:[--tile:calc((100%_-_11*var(--gap))/12)]"
      >
        {toRows(landed).map((row, r) => (
          <li key={r} className="w-full">
            <Reveal standalone delay={r * 0.05}>
              <ul className="flex flex-wrap justify-center gap-(--gap) md:flex-nowrap">
                {row.map((company) => (
                  <li
                    key={company.name}
                    title={company.name}
                    className={cn(
                      "flex aspect-square w-(--tile) shrink-0 items-center justify-center overflow-hidden rounded-full",
                      // a dark bubble needs an edge against the page
                      DARK.has(company.fill) && "border border-white/30",
                    )}
                    style={{ backgroundColor: company.fill }}
                  >
                    {company.mono ? (
                      <span
                        role="img"
                        aria-label={company.name}
                        className="block bg-white [mask-size:contain] [mask-position:center] [mask-repeat:no-repeat]"
                        style={{ maskImage: `url(${company.logo})`, ...box(company) }}
                      />
                    ) : (
                      <span className="relative block" style={box(company)}>
                        <Media
                          src={company.logo}
                          alt={company.name}
                          fill
                          className="object-contain"
                        />
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </Reveal>
          </li>
        ))}
      </ul>
    </Section>
  );
}
