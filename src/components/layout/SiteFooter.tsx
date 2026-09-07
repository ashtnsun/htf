import { ArrowUp, Mail } from "lucide-react";
import Link from "next/link";
import { getPrimaryCta, site, type NavLink } from "@content/site";
import { InstagramIcon, LinkedinIcon } from "@/components/icons/Social";
import { Logo } from "@/components/brand/Logo";
import { PixelDino } from "@/components/brand/PixelDino";
import { isTodo } from "@/lib/utils";

type Column = { title: string; links: (NavLink & { Icon?: typeof Mail })[] };

/**
 * Frosted-glass footer (logo, Explore · Get involved · Connect · Legal; no tagline, no
 * newsletter) with the
 * pixel dinosaur peeking out from behind the glass: its head sits in the open strip above
 * the panel, its body shows through the blur as a soft green shape.
 */
export function SiteFooter() {
  const cta = getPrimaryCta();
  const year = new Date().getFullYear();

  const columns: Column[] = [
    { title: "Explore", links: [...site.footer.explore] },
    {
      title: "Get involved",
      links: [
        { label: "Students", href: "/students" },
        { label: "Nonprofits", href: "/nonprofits" },
        cta,
      ],
    },
    {
      title: "Connect",
      links: [
        { label: "Instagram", href: site.socials.instagram, external: true, Icon: InstagramIcon },
        { label: "LinkedIn", href: site.socials.linkedin, external: true, Icon: LinkedinIcon },
        { label: "Email", href: `mailto:${site.socials.email}`, Icon: Mail },
      ].filter((l) => !isTodo(l.href.replace(/^mailto:/, ""))),
    },
    { title: "Legal", links: [...site.footer.legal] },
  ];

  return (
    <footer className="relative mt-8 overflow-hidden">
      {/* glow behind the dinosaur, bleeding into the glass */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 right-[-4rem] h-[30rem] w-[36rem] bg-[radial-gradient(closest-side,rgba(3,198,82,0.28),transparent)] sm:right-[2%]"
      />
      <PixelDino className="absolute top-3 right-4 z-0 w-[clamp(10rem,16vw,14rem)] sm:right-[8%]" />

      <div className="relative z-10 mt-24 border-t border-line-strong glass [--glass-alpha:72%] sm:mt-28">
        <div className="container-max container-x py-14 md:py-20">
          <div className="grid gap-12 lg:grid-cols-[1.4fr_repeat(4,1fr)] lg:gap-8">
            <div className="max-w-xs">
              <Logo height={26} />
            </div>

            {columns.map((col) => (
              <nav key={col.title} aria-labelledby={`footer-${col.title}`}>
                <h2
                  id={`footer-${col.title}`}
                  className="text-eyebrow font-medium text-muted uppercase"
                >
                  {col.title}
                </h2>
                <ul className="mt-5 space-y-3">
                  {col.links.map((link) => {
                    const external = link.external || /^https?:\/\//.test(link.href);
                    const className =
                      "inline-flex items-center gap-2 text-sm text-text transition-colors duration-200 hover:text-green";
                    return (
                      <li key={link.label}>
                        {external ? (
                          <a
                            href={link.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={className}
                          >
                            {link.Icon ? <link.Icon className="size-4 text-muted" /> : null}
                            {link.label}
                          </a>
                        ) : (
                          <Link href={link.href} className={className}>
                            {link.Icon ? <link.Icon className="size-4 text-muted" /> : null}
                            {link.label}
                          </Link>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        <div className="border-t border-line">
          <div className="container-max flex flex-col gap-4 container-x py-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
            <p>
              © {year} {site.legalName}. All rights reserved.
            </p>
            <a
              href="#main"
              className="inline-flex items-center gap-2 self-start transition-colors duration-200 hover:text-green sm:self-auto"
            >
              Back to top
              <ArrowUp className="size-3.5" aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
