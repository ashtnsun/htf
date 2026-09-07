import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Reveal } from "@/components/motion/Reveal";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Headline } from "@/components/ui/Headline";
import { Section } from "@/components/ui/Section";

type Panel = {
  eyebrow: string;
  title: string;
  copy: string;
  href: string;
  label: string;
};

const PANELS: readonly Panel[] = [
  {
    eyebrow: "Students",
    title: "Ship real software for a real client.",
    copy: "Join a small team for the school year as a project lead, developer or designer. Open to all majors, all years and all levels of experience.",
    href: "/students",
    label: "For students",
  },
  {
    eyebrow: "Nonprofits",
    title: "Get the tool your team actually needs.",
    copy: "Bring us a problem. A student team scopes it with you, builds it over the school year and hands it off free of charge.",
    href: "/nonprofits",
    label: "For nonprofits",
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
 * panel is one link in a full-bleed hairline row (the same row as "What we do"): eyebrow,
 * title, one sentence, and a label with the arrow cell. Hover follows the site-wide
 * language (corner brackets, the surface lifts a step, the arrow cell fills green). The two
 * panels share their row tracks (subgrid), so every line sits at the same height in both.
 * Also the "I'm a student / I'm a nonprofit" hand-off on /about.
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
        <ul className="grid border-y border-line md:bleed-row-2 md:grid-rows-[auto_auto_minmax(0,1fr)_auto]">
          {PANELS.map((panel) => (
            <li
              key={panel.href}
              className="border-b border-line last:border-b-0 md:row-span-4 md:grid md:grid-rows-subgrid md:border-r md:border-b-0 md:first:col-start-2 md:last:border-r-0"
            >
              <Link
                href={panel.href}
                className="group hover-corners flex h-full flex-col px-(--gutter) py-8 text-text transition-colors duration-200 hover:bg-surface-2 md:row-span-4 md:grid md:grid-rows-subgrid md:p-8 lg:p-10"
              >
                <Eyebrow tone="green">{panel.eyebrow}</Eyebrow>
                <h3 className="mt-4 max-w-md text-h3 md:mt-5">{panel.title}</h3>
                <p className="mt-3 max-w-md text-muted">{panel.copy}</p>
                <span className="mt-8 flex items-center justify-between gap-6 border-t border-line pt-5 md:mt-10">
                  <span className="text-sm font-medium">{panel.label}</span>
                  <span
                    aria-hidden="true"
                    className="flex size-11 shrink-0 items-center justify-center border border-line-strong bg-surface-2 text-green transition-colors duration-200 group-hover:border-green group-hover:bg-green group-hover:text-bg"
                  >
                    <ArrowRight className="size-5 transition-transform duration-300 ease-out-expo group-hover:translate-x-1" />
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Reveal>
    </Section>
  );
}
