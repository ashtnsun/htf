import type { Role } from "@/lib/content/schemas";
import { SeasonNote } from "@/components/layout/SeasonNote";
import { Reveal } from "@/components/motion/Reveal";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Headline } from "@/components/ui/Headline";
import { Section } from "@/components/ui/Section";
import { ROLE_ICONS } from "./roleIcons";

/**
 * The Framer role rows (number label, icon, title, blurb, description) plus what the
 * template left out: responsibilities, time commitment and who the role is for. The per-role
 * Apply button went in the 2026-09-09 review (the page's CTAs are the header and the closing
 * section). On large screens the intro sticks beside the rows, top-aligned with the first
 * row at rest; while the rows scroll past it holds a little below the site header and the
 * section bar (`--subnav-h`, set by SectionNav while mounted), so the bars never cover it
 * (the second 2026-09-09 review replaced the viewport-tall centred box).
 */
export function RoleRows({ roles }: { roles: Role[] }) {
  return (
    <Section id="roles" aria-labelledby="roles-title" className="border-t border-line">
      <div className="grid gap-12 lg:grid-cols-[1fr_1.7fr] lg:gap-16">
        <Reveal
          standalone
          className="lg:sticky lg:top-[calc(var(--header-h)+var(--subnav-h,0px)+2rem)] lg:self-start"
        >
          <Eyebrow>Roles</Eyebrow>
          <Headline
            as="h2"
            id="roles-title"
            size="h2"
            lines={["Available", "*roles.*"]}
            className="mt-5 md:text-display"
          />
          <p className="mt-6 max-w-sm text-muted">
            Every team is one project lead, five developers and one or two designers, working with
            one nonprofit for the school year. You can apply for more than one role.
          </p>
          <SeasonNote className="mt-4" />
        </Reveal>

        <ol className="divide-y divide-line border-y border-line">
          {roles.map((role, index) => {
            const Icon = ROLE_ICONS[role.icon];
            return (
              <li key={role.slug} id={`role-${role.slug}`} className="py-10 md:py-14">
                <Reveal standalone>
                  <div className="flex items-start justify-between gap-6">
                    <p className="text-eyebrow font-medium text-muted uppercase">
                      Role {String(index + 1).padStart(2, "0")}
                    </p>
                    <Icon aria-hidden="true" className="size-7 text-muted" strokeWidth={1.5} />
                  </div>
                  <h3 className="mt-6 text-h3 md:text-h2">{role.title}</h3>
                  <p className="mt-2 text-sm text-muted">{role.blurb}</p>
                  <p className="mt-5 max-w-2xl text-body-lg text-text">{role.description}</p>

                  <div className="mt-8 grid gap-8 sm:grid-cols-[1.4fr_1fr] sm:gap-10">
                    <div>
                      <h4 className="text-eyebrow font-medium text-muted uppercase">
                        What you’ll do
                      </h4>
                      <ul className="mt-4 space-y-2.5">
                        {role.responsibilities.map((item, i) => (
                          <li key={i} className="flex gap-3 text-sm text-text">
                            <span
                              aria-hidden="true"
                              className="mt-[0.45rem] size-1.5 shrink-0 bg-green"
                            />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <dl className="space-y-5">
                      <div>
                        <dt className="text-eyebrow font-medium text-muted uppercase">
                          Time commitment
                        </dt>
                        <dd className="mt-2 text-sm text-text">{role.timeCommitment}</dd>
                      </div>
                      <div>
                        <dt className="text-eyebrow font-medium text-muted uppercase">
                          Who it’s for
                        </dt>
                        <dd className="mt-2 text-sm text-text">{role.whoItsFor}</dd>
                      </div>
                    </dl>
                  </div>

                  {!role.open ? (
                    <p className="mt-10 text-sm text-muted">
                      Not recruiting for this role this cycle.
                    </p>
                  ) : null}
                </Reveal>
              </li>
            );
          })}
        </ol>
      </div>
    </Section>
  );
}
