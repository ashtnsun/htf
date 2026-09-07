import type { Metadata } from "next";
import { PageHero } from "@/components/layout/PageHero";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Section } from "@/components/ui/Section";
import { requireUser } from "@/lib/auth/session";
import { getActiveCycle, getOpenRoles, getQuestions } from "@/lib/portal/data";

export const metadata: Metadata = {
  title: "Your application",
  robots: { index: false },
};

/**
 * The application form (PLAN.md section 5, Session 8: profile → roles → questions → review,
 * with autosave). Until then this signed-in page shows what the form will ask, read from the
 * same tables the form will write to.
 */
export default async function ApplyFormPage() {
  const user = await requireUser("/apply/form");
  const cycle = await getActiveCycle();
  const [roles, questions] = await Promise.all([
    cycle ? getOpenRoles(cycle.id) : Promise.resolve([]),
    cycle ? getQuestions(cycle.id) : Promise.resolve([]),
  ]);
  const shared = questions.filter((q) => q.role_id === null);

  return (
    <>
      <PageHero
        eyebrow={cycle ? `${cycle.name} application` : "Application"}
        lines={["Your", "*application.*"]}
        stagger={false}
        blurb={`Signed in as ${user.email}.`}
        back={{ href: "/apply", label: "Back to your status" }}
      />

      <Section aria-labelledby="apply-form-title" className="border-t border-line">
        <div className="border border-dashed border-line-strong p-6">
          <p id="apply-form-title" className="text-text">
            The application form is being built.
          </p>
          <p className="mt-2 text-sm text-muted">
            [TODO: Session 8 adds the multi-step form with autosave.] Here is what it will ask.
          </p>
        </div>

        <div className="mt-14 grid gap-14 lg:grid-cols-2 lg:gap-20">
          <div>
            <Eyebrow>Roles</Eyebrow>
            <ul className="mt-5 border-t border-line">
              {roles.map((role) => (
                <li key={role.id} className="border-b border-line py-4">
                  <span className="block text-text">{role.name}</span>
                  {role.description ? (
                    <span className="mt-1 block text-sm text-muted">{role.description}</span>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <Eyebrow>Questions for everyone</Eyebrow>
            <ol className="mt-5 border-t border-line">
              {shared.map((question) => (
                <li key={question.id} className="border-b border-line py-4">
                  <span className="block text-text">{question.prompt}</span>
                  <span className="mt-1 block text-sm text-muted">
                    {question.kind === "select" || question.kind === "multiselect"
                      ? (question.options ?? []).join(" · ")
                      : question.max_chars
                        ? `Up to ${question.max_chars.toLocaleString("en-US")} characters`
                        : "Free text"}
                    {question.required ? "" : " · optional"}
                  </span>
                </li>
              ))}
            </ol>
            {roles.map((role) => {
              const own = questions.filter((q) => q.role_id === role.id);
              if (own.length === 0) return null;
              return (
                <div key={role.id} className="mt-10">
                  <Eyebrow tone="muted">If you apply as {role.name}</Eyebrow>
                  <ol className="mt-5 border-t border-line">
                    {own.map((question) => (
                      <li key={question.id} className="border-b border-line py-4">
                        <span className="block text-text">{question.prompt}</span>
                        {question.help ? (
                          <span className="mt-1 block text-sm text-muted">{question.help}</span>
                        ) : null}
                      </li>
                    ))}
                  </ol>
                </div>
              );
            })}
          </div>
        </div>
      </Section>
    </>
  );
}
