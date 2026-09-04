import type { Metadata } from "next";
import { PageHero } from "@/components/layout/PageHero";
import { SplitButton } from "@/components/ui/SplitButton";

export const metadata: Metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <PageHero
      eyebrow="404"
      lines={["Nothing here,", "*yet.*"]}
      blurb="The page you are looking for moved or never existed. Try one of these instead."
    >
      <div className="flex flex-wrap gap-4">
        <SplitButton href="/">Back to home</SplitButton>
        <SplitButton href="/projects" variant="secondary">
          See our projects
        </SplitButton>
      </div>
    </PageHero>
  );
}
