import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { formatDeadline, isInSeason, site } from "@content/site";
import { PageHero } from "@/components/layout/PageHero";
import { SplitButton } from "@/components/ui/SplitButton";
import { isTodo } from "@/lib/utils";

export const metadata: Metadata = { title: "Page not found", robots: { index: false } };

const PAGES = [
  { href: "/projects", label: "Projects", blurb: "Software we built for nonprofit partners." },
  { href: "/students", label: "Students", blurb: "Roles, the recruitment timeline and FAQ." },
  { href: "/nonprofits", label: "Nonprofits", blurb: "How a partnership works." },
  { href: "/about", label: "About", blurb: "Who we are and who runs the club." },
  { href: "/contact", label: "Contact", blurb: "Send us a message." },
];

const inlineLink = "font-medium text-green transition-colors duration-200 hover:text-text";

/**
 * Global 404: hero with a ghosted "404", two CTAs, a grid of the main pages, the
 * application link while applications are open, and a way to report a broken link.
 */
export default function NotFound() {
  const email = isTodo(site.socials.email) ? null : site.socials.email;
  const inSeason = isInSeason();
  const deadline = formatDeadline();

  return (
    <PageHero
      eyebrow="404"
      ghost="404"
      lines={["Nothing here,", "*yet.*"]}
      blurb="The page you are looking for moved or never existed. Try one of these instead."
    >
      <div className="flex flex-wrap gap-4">
        <SplitButton href="/">Back to home</SplitButton>
        <SplitButton href="/projects" variant="secondary">
          See our projects
        </SplitButton>
      </div>

      <nav aria-label="Popular pages" className="mt-14">
        <p className="text-eyebrow font-medium text-muted uppercase">Popular pages</p>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {PAGES.map((page) => (
            <li key={page.href}>
              <Link
                href={page.href}
                className="group hover-corners flex h-full min-h-20 items-center justify-between gap-4 border border-line bg-surface/60 px-5 py-4 transition-colors duration-200 hover:border-line-strong hover:bg-surface-2"
              >
                <span>
                  <span className="block text-text">{page.label}</span>
                  <span className="mt-1 block text-sm text-muted">{page.blurb}</span>
                </span>
                <ArrowRight
                  className="size-4 shrink-0 text-muted transition-[transform,color] duration-300 group-hover:translate-x-1 group-hover:text-green"
                  aria-hidden="true"
                />
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {inSeason ? (
        <p className="mt-10 text-sm text-muted">
          Looking for the application?{" "}
          <Link href="/apply" className={inlineLink}>
            Apply now
          </Link>
          {deadline ? `. ${site.season.cycleName} applications close ${deadline}.` : "."}
        </p>
      ) : null}
      {email ? (
        <p className="mt-3 text-sm text-muted">
          Followed a broken link from somewhere?{" "}
          <a href={`mailto:${email}`} className={inlineLink}>
            Tell us
          </a>{" "}
          and we will fix it.
        </p>
      ) : null}
    </PageHero>
  );
}
