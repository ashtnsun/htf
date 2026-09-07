import { ArrowUpRight, GraduationCap, HeartHandshake, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { Reveal } from "@/components/motion/Reveal";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Headline } from "@/components/ui/Headline";
import { Section } from "@/components/ui/Section";

type Panel = {
  eyebrow: string;
  title: string;
  copy: string;
  /** Three short facts already stated in the site copy, shown as a spec row. */
  facts: readonly [string, string, string];
  href: string;
  label: string;
  Icon: LucideIcon;
};

const PANELS: readonly Panel[] = [
  {
    eyebrow: "Students",
    title: "Ship real software for a real client.",
    copy: "Join a small team for the school year as a project lead, developer or designer, and build something a nonprofit will actually use. Open to all majors, all years, and all levels of experience.",
    facts: ["Lead, developer or designer", "All majors, all years", "One school year"],
    href: "/students",
    label: "For students",
    Icon: GraduationCap,
  },
  {
    eyebrow: "Nonprofits",
    title: "Get the tool your team actually needs.",
    copy: "Bring us a problem. A student team scopes it with you, builds it over the school year, and hands it off ready to use.",
    facts: ["Scoped with you", "Built over the year", "Handed off, free"],
    href: "/nonprofits",
    label: "For nonprofits",
    Icon: HeartHandshake,
  },
];

type WhoWeServeProps = {
  id?: string;
  eyebrow?: string;
  /** Headline lines; *asterisks* mark the green words. */
  lines?: string[];
};

/**
 * Two panels, one per audience, so a first-time visitor finds their page in one click. Each
 * panel is one link with the site-wide hover language (corner brackets, the arrow cell fills
 * green): an outlined index, the audience icon, title, copy, a three-cell spec row and the
 * arrow footer. The two panels share their row tracks (subgrid), so every line of text sits
 * at the same height in both. Also the "I'm a student / I'm a nonprofit" hand-off on /about.
 */
export function WhoWeServe({
  id = "who-we-serve",
  eyebrow = "Who we serve",
  lines = ["Two audiences, *one mission*."],
}: WhoWeServeProps) {
  const titleId = `${id}-title`;
  return (
    <Section id={id} aria-labelledby={titleId} className="border-t border-line">
      <Reveal standalone>
        <Eyebrow>{eyebrow}</Eyebrow>
        <Headline as="h2" id={titleId} size="h2" lines={lines} className="mt-5" />
      </Reveal>
      <Reveal standalone delay={0.1} className="mt-12">
        <ul className="grid gap-6 md:grid-cols-2 md:grid-rows-[repeat(5,auto)] md:gap-y-0">
          {PANELS.map((panel, i) => (
            <li key={panel.href} className="md:row-span-5 md:grid md:grid-rows-subgrid">
              <Link
                href={panel.href}
                className="group hover-corners relative grid h-full grid-rows-[repeat(5,auto)] overflow-hidden border border-line bg-surface p-6 text-text transition-[border-color,background-color] duration-200 hover:border-line-strong hover:bg-surface-2 md:row-span-5 md:grid-rows-subgrid md:p-8"
              >
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -top-8 -right-8 h-40 w-40 bg-[radial-gradient(closest-side,rgba(3,198,82,0.14),transparent)] transition-opacity duration-300 group-hover:opacity-0"
                />
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute top-0 right-0 h-full w-1/2 bg-[linear-gradient(to_right,var(--line)_1px,transparent_1px),linear-gradient(to_bottom,var(--line)_1px,transparent_1px)] [mask-image:linear-gradient(to_left,#000,transparent)] bg-[size:1.5rem_1.5rem] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                />

                <div className="relative flex items-start justify-between gap-4">
                  <span className="flex size-11 items-center justify-center border border-line-strong bg-surface-2 text-green transition-colors duration-200 group-hover:border-green">
                    <panel.Icon className="size-5" strokeWidth={1.75} aria-hidden="true" />
                  </span>
                  <span
                    aria-hidden="true"
                    className="font-display text-display leading-none font-medium text-transparent transition-[-webkit-text-stroke-color] duration-300 [-webkit-text-stroke:1px_var(--line-strong)] group-hover:[-webkit-text-stroke-color:var(--green)]"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>

                <Eyebrow tone="green" className="relative mt-8">
                  {panel.eyebrow}
                </Eyebrow>
                <h3 className="relative mt-3 text-h3 transition-colors duration-300 group-hover:text-green">
                  {panel.title}
                </h3>
                <p className="relative mt-3 text-muted">{panel.copy}</p>

                <div className="relative mt-8 border-t border-line">
                  <dl className="grid grid-cols-3 divide-x divide-line border-b border-line">
                    {panel.facts.map((fact, j) => (
                      <div key={fact} className="px-3 py-3 first:pl-0">
                        <dt className="text-eyebrow font-medium text-muted uppercase">
                          {String(j + 1).padStart(2, "0")}
                        </dt>
                        <dd className="mt-1.5 text-xs leading-snug text-text">{fact}</dd>
                      </div>
                    ))}
                  </dl>
                  <div className="flex items-center justify-between gap-6 pt-5">
                    <span className="text-sm font-medium">{panel.label}</span>
                    <span
                      aria-hidden="true"
                      className="flex size-11 shrink-0 items-center justify-center border border-line-strong bg-surface-2 text-green transition-colors duration-200 group-hover:border-green group-hover:bg-green group-hover:text-bg"
                    >
                      <ArrowUpRight className="size-5" />
                    </span>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </Reveal>
    </Section>
  );
}
