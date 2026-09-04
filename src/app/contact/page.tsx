import type { Metadata } from "next";
import { site } from "@content/site";
import { PageHero } from "@/components/layout/PageHero";
import { StubSection } from "@/components/layout/StubSection";
import { isTodo } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with Hack the Future at Purdue.",
};

export default function ContactPage() {
  const email = isTodo(site.socials.email) ? null : site.socials.email;
  return (
    <>
      <PageHero
        eyebrow="Contact"
        lines={["Let’s talk."]}
        stagger={false}
        blurb={
          email
            ? `Email us at ${email} or find us on Instagram ${site.socials.instagramHandle}.`
            : `Find us on Instagram ${site.socials.instagramHandle}. [TODO: club email]`
        }
      />
      <StubSection
        phase="Session 4"
        items={["Contact form (name, email, I am a…, message)", "Direct email and socials"]}
      />
    </>
  );
}
