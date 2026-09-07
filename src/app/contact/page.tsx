import type { Metadata } from "next";
import { ArrowUpRight, Mail } from "lucide-react";
import Link from "next/link";
import type { ComponentType, SVGProps } from "react";
import { formatDeadline, isInSeason, site } from "@content/site";
import { ContactForm } from "@/components/contact/ContactForm";
import { InstagramIcon, LinkedinIcon } from "@/components/icons/Social";
import { PageHero } from "@/components/layout/PageHero";
import { Reveal } from "@/components/motion/Reveal";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Section } from "@/components/ui/Section";
import { SplitButton } from "@/components/ui/SplitButton";
import { isContactFormConfigured } from "@/lib/contact/deliver";
import { isTodo } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with Hack the Future at Purdue: questions about joining, a nonprofit project to pitch, or anything else.",
  alternates: { canonical: "/contact" },
};

const factLabel = "text-eyebrow font-medium text-muted uppercase";
const inlineLink = "font-medium text-green transition-colors duration-200 hover:text-text";

type Channel = {
  label: string;
  value: string;
  href: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
};

/**
 * Contact: hero, then the form beside the direct channels. The form's mode comes from the
 * environment (see src/lib/contact/deliver.ts): server delivery when Supabase or Resend is
 * configured, a mailto: fallback when only the club email is known, and a visible TODO
 * with the Instagram button when neither exists yet.
 */
export default function ContactPage() {
  const email = isTodo(site.socials.email) ? null : site.socials.email;
  const linkedin = isTodo(site.socials.linkedin) ? null : site.socials.linkedin;
  const mode = isContactFormConfigured() ? "server" : email ? "mailto" : null;
  const inSeason = isInSeason();
  const deadline = formatDeadline();

  const channels: Channel[] = [];
  if (email) channels.push({ label: "Email", value: email, href: `mailto:${email}`, Icon: Mail });
  channels.push({
    label: "Instagram",
    value: site.socials.instagramHandle,
    href: site.socials.instagram,
    Icon: InstagramIcon,
  });
  if (linkedin) {
    channels.push({ label: "LinkedIn", value: site.legalName, href: linkedin, Icon: LinkedinIcon });
  }

  return (
    <>
      <PageHero
        eyebrow="Contact"
        lines={["Let’s talk."]}
        stagger={false}
        blurb="Questions about joining, a nonprofit project you would like to pitch, or anything else: send a note and we will reply by email."
      />

      <Section aria-labelledby="contact-form-title" className="border-t border-line">
        <div className="grid gap-14 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:gap-20">
          <Reveal standalone>
            <Eyebrow>Send a message</Eyebrow>
            <h2 id="contact-form-title" className="mt-5 text-h3">
              Tell us what’s on your mind.
            </h2>
            <div className="relative mt-8">
              {mode ? (
                <ContactForm mode={mode} email={email} />
              ) : (
                <div className="border border-dashed border-line-strong p-6">
                  <p className="text-text">The contact form is not connected yet.</p>
                  <p className="mt-2 text-sm text-muted">
                    [TODO: set the club email in content/site.ts for the mailto fallback, or add the
                    Supabase / Resend keys from .env.example.] Until then, message us on Instagram.
                  </p>
                  <SplitButton href={site.socials.instagram} className="mt-6">
                    Message us on Instagram
                  </SplitButton>
                </div>
              )}
            </div>
          </Reveal>

          <Reveal standalone delay={0.1} className="space-y-12">
            <div>
              <p className={factLabel}>Other ways to reach us</p>
              <ul className="mt-4 border-t border-line">
                {channels.map((c) => {
                  const external = /^https?:\/\//.test(c.href);
                  return (
                    <li key={c.label} className="border-b border-line">
                      <a
                        href={c.href}
                        target={external ? "_blank" : undefined}
                        rel={external ? "noopener noreferrer" : undefined}
                        className="group flex min-h-16 items-center gap-4 py-3"
                      >
                        <c.Icon className="size-5 shrink-0 text-muted" aria-hidden="true" />
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm text-muted">{c.label}</span>
                          <span className="block truncate text-text transition-colors group-hover:text-green">
                            {c.value}
                          </span>
                        </span>
                        <ArrowUpRight
                          className="size-4 shrink-0 text-muted transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                          aria-hidden="true"
                        />
                      </a>
                    </li>
                  );
                })}
                {!email ? (
                  <li className="border-b border-line py-4 text-sm text-muted">
                    Email: [TODO: club contact email]
                  </li>
                ) : null}
              </ul>
            </div>

            <div>
              <p className={factLabel}>Before you write</p>
              <ul className="mt-4 space-y-5 text-muted">
                <li>
                  <span className="block text-text">Want to join?</span>
                  {inSeason ? (
                    <span className="mt-1 block text-sm">
                      {site.season.cycleName} applications are open
                      {deadline ? ` and close ${deadline}` : ""}.{" "}
                      <Link href="/apply" className={inlineLink}>
                        Apply now
                      </Link>{" "}
                      or read about the{" "}
                      <Link href="/students#roles" className={inlineLink}>
                        roles
                      </Link>
                      .
                    </span>
                  ) : (
                    <span className="mt-1 block text-sm">
                      See the{" "}
                      <Link href="/students" className={inlineLink}>
                        roles and timeline
                      </Link>{" "}
                      for the next cycle.
                    </span>
                  )}
                </li>
                <li>
                  <span className="block text-text">Run a nonprofit?</span>
                  <span className="mt-1 block text-sm">
                    Read{" "}
                    <Link href="/nonprofits" className={inlineLink}>
                      how a partnership works
                    </Link>{" "}
                    before you pitch, or just describe the problem in the form.
                  </span>
                </li>
                <li>
                  <span className="block text-text">Curious what we build?</span>
                  <span className="mt-1 block text-sm">
                    <Link href="/projects" className={inlineLink}>
                      Browse the projects
                    </Link>{" "}
                    from past partners.
                  </span>
                </li>
              </ul>
            </div>
          </Reveal>
        </div>
      </Section>
    </>
  );
}
