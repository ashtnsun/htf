import type { Metadata } from "next";
import { ArrowUpRight, Mail } from "lucide-react";
import type { ComponentType, SVGProps } from "react";
import { site } from "@content/site";
import { InstagramIcon, LinkedinIcon } from "@/components/icons/Social";
import { PageHero } from "@/components/layout/PageHero";
import { Reveal } from "@/components/motion/Reveal";
import { Section } from "@/components/ui/Section";
import { isTodo } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Reach Hack the Future at Purdue by email, on LinkedIn or on Instagram: questions about joining, a nonprofit project to pitch, or anything else.",
  alternates: { canonical: "/contact" },
};

type Channel = {
  label: string;
  value: string;
  /** Null while the address is a TODO: the tile shows the value as text, without a link. */
  href: string | null;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
};

/**
 * Contact: the hero and the three ways to reach the club (email, LinkedIn, Instagram) as a
 * hairline row of link tiles. No form since the 2026-09-09 review: messages are handled by
 * email. A TODO address renders as visible TODO text rather than a broken link.
 */
export default function ContactPage() {
  const email = isTodo(site.socials.email) ? null : site.socials.email;
  const linkedin = isTodo(site.socials.linkedin) ? null : site.socials.linkedin;
  const channels: Channel[] = [
    {
      label: "Email",
      value: email ?? "[TODO: club contact email]",
      href: email ? `mailto:${email}` : null,
      Icon: Mail,
    },
    {
      label: "LinkedIn",
      value: site.legalName,
      href: linkedin,
      Icon: LinkedinIcon,
    },
    {
      label: "Instagram",
      value: site.socials.instagramHandle,
      href: site.socials.instagram,
      Icon: InstagramIcon,
    },
  ];

  return (
    <>
      <PageHero
        eyebrow="Contact"
        lines={["Let’s talk."]}
        stagger={false}
        blurb="Questions about joining, a nonprofit project you would like to pitch, or anything else: email us, or find us on LinkedIn and Instagram."
      />

      <Section aria-label="Ways to reach us" className="border-t border-line">
        <Reveal standalone>
          <ul className="grid gap-px border border-line bg-line sm:grid-cols-3">
            {channels.map((channel) => {
              const external = channel.href ? /^https?:\/\//.test(channel.href) : false;
              const body = (
                <div>
                  <channel.Icon className="size-6 text-muted" aria-hidden="true" />
                  <p className="mt-10 text-eyebrow font-medium text-muted uppercase">
                    {channel.label}
                  </p>
                  <p className="mt-2 flex items-start justify-between gap-4">
                    <span className="min-w-0 text-body-lg font-medium text-text transition-colors duration-200 group-hover:text-green">
                      {channel.value}
                    </span>
                    {channel.href ? (
                      <ArrowUpRight
                        className="mt-1 size-5 shrink-0 text-muted transition-transform duration-300 ease-out-expo group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                        aria-hidden="true"
                      />
                    ) : null}
                  </p>
                </div>
              );
              return (
                <li key={channel.label} className="bg-bg">
                  {channel.href ? (
                    <a
                      href={channel.href}
                      target={external ? "_blank" : undefined}
                      rel={external ? "noopener noreferrer" : undefined}
                      className="group hover-corners flex h-full min-h-56 flex-col justify-between p-6 transition-colors duration-200 hover:bg-surface-2 focus-visible:outline-offset-[-3px] md:p-8"
                    >
                      {body}
                    </a>
                  ) : (
                    <div className="flex h-full min-h-56 flex-col justify-between p-6 md:p-8">
                      {body}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </Reveal>
      </Section>
    </>
  );
}
