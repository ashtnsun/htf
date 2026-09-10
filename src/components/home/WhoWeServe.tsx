import Link from "next/link";
import { AudienceGraphic, type AudienceGraphicName } from "@/components/home/WhoWeServeGraphics";
import { Reveal } from "@/components/motion/Reveal";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Headline } from "@/components/ui/Headline";
import { Section } from "@/components/ui/Section";
import { SplitButton } from "@/components/ui/SplitButton";

type Panel = {
  /** The pixel picture at the top of the panel (home/WhoWeServeGraphics). */
  graphic: AudienceGraphicName;
  eyebrow: string;
  title: string;
  copy: string;
  href: string;
};

const PANELS: readonly Panel[] = [
  {
    graphic: "books",
    eyebrow: "Students",
    title: "Ship real software for a real client.",
    copy: "Join a small team for the school year as a project lead, developer or designer. Open to all majors, all years and all levels of experience.",
    href: "/students",
  },
  {
    graphic: "heart",
    eyebrow: "Nonprofits",
    title: "Get the tool your team actually needs.",
    copy: "Bring us a problem. A student team scopes it with you, builds it over the school year and hands it off free of charge.",
    href: "/nonprofits",
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
 * panel is one link in a full-bleed hairline row (the same row as "What we do", framed by
 * vertical rails): a pixel picture (a stack of books for students, a heart for nonprofits,
 * drawn like the process scene; 2026-09-09 review), eyebrow, title, one
 * sentence and a "Learn more" button. Hovering the panel turns the title green and puts the
 * button in its hover state (green border, the arrow cell fills), the treatment the project
 * cards use; nothing moves. The two panels share their row tracks (subgrid), so every line
 * sits at the same height in both. Also the "I'm a student / I'm a nonprofit" hand-off on
 * /about.
 */
export function WhoWeServe({
  id = "who-we-serve",
  eyebrow = "Who we serve",
  lines = ["Two audiences, *one mission*."],
}: WhoWeServeProps) {
  const titleId = `${id}-title`;
  return (
    <Section id={id} aria-labelledby={titleId} contain={false} className="border-t border-line">
      <div className="container-max container-x">
        <Reveal standalone>
          <Eyebrow>{eyebrow}</Eyebrow>
          <Headline as="h2" id={titleId} size="h2" lines={lines} className="mt-5" />
        </Reveal>
      </div>
      <Reveal standalone delay={0.1} className="mt-12">
        <ul className="grid border-y border-line md:bleed-row-2 md:grid-rows-[auto_auto_auto_minmax(0,1fr)_auto]">
          {PANELS.map((panel) => (
            <li
              key={panel.href}
              className="border-b border-line last:border-b-0 md:row-span-5 md:grid md:grid-rows-subgrid md:border-r md:border-b-0 md:first:col-start-2 md:first:border-l"
            >
              <Link
                href={panel.href}
                className="group flex h-full flex-col px-(--gutter) py-8 text-text md:row-span-5 md:grid md:grid-rows-subgrid md:p-8 lg:p-10"
              >
                <span className="relative block w-30 select-none">
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute -inset-[30%] bg-[radial-gradient(closest-side,rgba(3,198,82,0.16),transparent)]"
                  />
                  <AudienceGraphic name={panel.graphic} className="relative w-full" />
                </span>
                <Eyebrow tone="green" className="mt-8">
                  {panel.eyebrow}
                </Eyebrow>
                <h3 className="mt-4 max-w-md text-h3 transition-colors duration-200 group-hover:text-green md:mt-5">
                  {panel.title}
                </h3>
                <p className="mt-3 max-w-md text-muted">{panel.copy}</p>
                <span className="mt-8 flex md:mt-10">
                  <SplitButton presentational variant="secondary">
                    Learn more
                  </SplitButton>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Reveal>
    </Section>
  );
}
