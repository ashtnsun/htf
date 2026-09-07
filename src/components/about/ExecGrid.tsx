import { User } from "lucide-react";
import type { ExecMember } from "@/lib/content/schemas";
import { LinkedinIcon } from "@/components/icons/Social";
import { Reveal, RevealGroup } from "@/components/motion/Reveal";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Headline } from "@/components/ui/Headline";
import { Media } from "@/components/ui/Media";
import { Section } from "@/components/ui/Section";
import { isTodo } from "@/lib/utils";

/** Exec board: a 4:5 photo, name, role and a LinkedIn button per member (content/exec.ts). */
export function ExecGrid({ members }: { members: ExecMember[] }) {
  if (members.length === 0) return null;
  return (
    <Section id="exec" aria-labelledby="exec-title" grid className="border-t border-line">
      <RevealGroup>
        <Reveal className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <Eyebrow>Exec board</Eyebrow>
            <Headline
              as="h2"
              id="exec-title"
              size="h2"
              lines={["The people", "*running it.*"]}
              className="mt-5"
            />
          </div>
          <p className="max-w-sm text-muted">
            The exec board runs recruitment, nonprofit intake and the project cycle. [TODO: how to
            reach the board, or a line about elections.]
          </p>
        </Reveal>
        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {members.map((member) => {
            const linkedin = member.linkedin && !isTodo(member.linkedin) ? member.linkedin : null;
            return (
              <li key={member.slug}>
                <Reveal className="h-full">
                  <article className="flex h-full flex-col border border-line bg-surface">
                    <div className="relative aspect-[4/5] overflow-hidden border-b border-line bg-surface-2">
                      {member.photo ? (
                        <Media
                          src={member.photo}
                          alt={isTodo(member.name) ? "" : `Portrait of ${member.name}`}
                          fill
                          sizes="(min-width: 1280px) 22vw, (min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
                          className="object-cover"
                        />
                      ) : (
                        <span
                          aria-hidden="true"
                          className="flex size-full items-center justify-center text-muted"
                        >
                          <User className="size-10" strokeWidth={1.25} />
                        </span>
                      )}
                    </div>
                    <div className="flex flex-1 items-center gap-4 p-5">
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-body-lg font-medium text-text">
                          {member.name}
                        </h3>
                        <p className="mt-0.5 text-sm text-muted">{member.role}</p>
                      </div>
                      {linkedin ? (
                        <a
                          href={linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`${member.name} on LinkedIn`}
                          className="flex size-11 shrink-0 items-center justify-center border border-line-strong text-muted transition-colors duration-200 hover:border-green hover:text-green"
                        >
                          <LinkedinIcon className="size-4" />
                        </a>
                      ) : null}
                    </div>
                  </article>
                </Reveal>
              </li>
            );
          })}
        </ul>
      </RevealGroup>
    </Section>
  );
}
