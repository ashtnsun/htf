import { getPrimaryCta, isInSeason } from "@content/site";
import type { Role } from "@/lib/content/schemas";
import { SeasonNote } from "@/components/layout/SeasonNote";
import { Reveal } from "@/components/motion/Reveal";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Headline } from "@/components/ui/Headline";
import { Section } from "@/components/ui/Section";
import { SplitButton } from "@/components/ui/SplitButton";
import { ROLE_ICONS } from "./roleIcons";

/**
 * The Framer role rows (number label, icon, title, blurb, description, Apply button) plus what
 * the template left out: responsibilities, time commitment and who the role is for. The section
 * heading sticks beside the rows on large screens. In season the button applies for that role;
 * out of season it falls back to the site's Contact CTA.
 */
export function RoleRows({ roles }: { roles: Role[] }) {
  const cta = getPrimaryCta();
  const inSeason = isInSeason();

  return (
    <Section id="roles" aria-labelledby="roles-title" className="border-t border-line">
      <div className="grid gap-12 lg:grid-cols-[1fr_1.7fr] lg:gap-16">
        <Reveal standalone className="lg:sticky lg:top-24 lg:self-start">
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

                  <div className="mt-10 flex sm:justify-end">
                    {role.open ? (
                      <SplitButton href={cta.href}>
                        {inSeason ? `Apply as ${role.title}` : cta.label}
                      </SplitButton>
                    ) : (
                      <p className="text-sm text-muted">Not recruiting for this role this cycle.</p>
                    )}
                  </div>
                </Reveal>
              </li>
            );
          })}
        </ol>
      </div>
    </Section>
  );
}
