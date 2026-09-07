import { Check } from "lucide-react";
import type { FormRole } from "@/components/apply/ApplicationForm";
import { CountedTextArea } from "@/components/forms/CountedTextArea";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { CheckboxGroupField, ChoiceField, TextField } from "@/components/ui/Field";
import {
  answerField,
  answerMax,
  EMAIL_MAX,
  groupQuestions,
  MAJOR_MAX,
  NAME_MAX,
  URL_MAX,
  YEARS,
  type AnswerValue,
  type ProfileField,
  type ProfileValues,
  type Question,
} from "@/lib/apply/schema";
import { cn } from "@/lib/utils";

/**
 * The editable steps of the application form. Each renders the shared field primitives
 * with the saved draft as default values, or the values echoed back by a failed submit.
 */

type StepProps = {
  /** Echoed by the server action after a failed submit (React resets the form). */
  values?: Record<string, AnswerValue>;
  errors: Record<string, string>;
};

const textButton =
  "min-h-11 text-sm text-muted underline decoration-green/70 underline-offset-4 transition-colors hover:text-green disabled:opacity-60";

function stringValue(value: AnswerValue | undefined): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function listValue(value: AnswerValue | undefined): string[] | undefined {
  return Array.isArray(value) ? value : undefined;
}

export function ProfileStep({
  profile,
  email,
  values,
  errors,
}: StepProps & { profile: ProfileValues | null; email: string }) {
  const value = (field: ProfileField) => stringValue(values?.[field]) ?? profile?.[field] ?? "";
  return (
    <div className="space-y-6">
      <TextField
        id="apply-full-name"
        name="full_name"
        label="Full name"
        autoComplete="name"
        maxLength={NAME_MAX}
        defaultValue={value("full_name")}
        error={errors.full_name}
      />
      <ChoiceField
        id="apply-year"
        name="year"
        legend="Year"
        options={YEARS.map((year) => ({ value: year, label: year }))}
        defaultValue={value("year")}
        error={errors.year}
      />
      <TextField
        id="apply-major"
        name="major"
        label="Major"
        hint="Or your program, if that fits better."
        maxLength={MAJOR_MAX}
        defaultValue={value("major")}
        error={errors.major}
      />
      <TextField
        id="apply-purdue-email"
        name="purdue_email"
        type="email"
        label="Purdue email"
        hint={`Only if it's different from ${email}. We still write to ${email}.`}
        required={false}
        autoComplete="email"
        inputMode="email"
        maxLength={EMAIL_MAX}
        defaultValue={value("purdue_email")}
        error={errors.purdue_email}
      />
      <div className="grid gap-6 sm:grid-cols-2">
        <TextField
          id="apply-linkedin"
          name="linkedin_url"
          label="LinkedIn"
          required={false}
          inputMode="url"
          autoCapitalize="off"
          spellCheck={false}
          placeholder="linkedin.com/in/you"
          maxLength={URL_MAX}
          defaultValue={value("linkedin_url")}
          error={errors.linkedin_url}
        />
        <TextField
          id="apply-portfolio"
          name="portfolio_url"
          label="Portfolio or website"
          hint="Designers: this is where your portfolio goes."
          required={false}
          inputMode="url"
          autoCapitalize="off"
          spellCheck={false}
          placeholder="your-site.com"
          maxLength={URL_MAX}
          defaultValue={value("portfolio_url")}
          error={errors.portfolio_url}
        />
      </div>
    </div>
  );
}

export function RolesStep({
  roles,
  applied,
  values,
  errors,
}: StepProps & { roles: FormRole[]; applied: string[] }) {
  const picked = listValue(values?.roles) ?? applied;
  const error = errors.roles;
  return (
    <fieldset
      aria-invalid={error ? true : undefined}
      aria-describedby={error ? "apply-roles-error" : "apply-roles-hint"}
    >
      <legend className="block text-sm font-medium text-text">
        Which roles are you applying for?
      </legend>
      <p id="apply-roles-hint" className="mt-1 text-sm text-muted">
        Pick as many as you like. Some roles add a question or two.
      </p>
      {roles.length > 0 ? (
        <ul className="mt-4 grid gap-3">
          {roles.map((role) => (
            <li key={role.id}>
              <label
                className={cn(
                  "group hover-corners relative block cursor-pointer border bg-surface transition-colors duration-200",
                  "hover:border-line-strong hover:bg-surface-2 has-checked:border-green",
                  "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-3 has-[:focus-visible]:outline-mint",
                  error ? "border-cyan" : "border-line",
                )}
              >
                <input
                  type="checkbox"
                  name="roles"
                  value={role.id}
                  defaultChecked={picked.includes(role.id)}
                  className="sr-only"
                />
                <span className="flex items-start gap-4 p-5">
                  <span
                    aria-hidden="true"
                    className="mt-0.5 flex size-5 shrink-0 items-center justify-center border border-line-strong bg-bg text-transparent transition-colors duration-200 group-has-checked:border-green group-has-checked:bg-green group-has-checked:text-bg"
                  >
                    <Check className="size-3.5" strokeWidth={3} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium text-text">{role.name}</span>
                    {role.description ? (
                      <span className="mt-1 block text-sm text-muted">{role.description}</span>
                    ) : null}
                    <span className="mt-2 block text-xs text-muted">
                      {role.questionCount === 0
                        ? "No extra questions"
                        : role.questionCount === 1
                          ? "Adds 1 question"
                          : `Adds ${role.questionCount} questions`}
                    </span>
                  </span>
                </span>
              </label>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-muted">
          [TODO: no roles are configured for this cycle yet (supabase/seed.sql).]
        </p>
      )}
      {error ? (
        <p id="apply-roles-error" className="mt-3 text-sm text-cyan">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}

export function QuestionsStep({
  roles,
  questions,
  applied,
  answers,
  values,
  errors,
  pending,
}: StepProps & {
  roles: FormRole[];
  questions: Question[];
  applied: string[];
  answers: Record<string, AnswerValue>;
  pending: boolean;
}) {
  const groups = groupQuestions(questions, roles, applied);
  return (
    <div className="space-y-12">
      {applied.length === 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-4 border border-line bg-surface p-5">
          <p className="text-sm text-muted">
            You haven&apos;t picked a role yet. Role questions appear here once you do.
          </p>
          <button
            type="submit"
            name="nav"
            value="roles"
            formNoValidate
            disabled={pending}
            className={textButton}
          >
            Pick roles
          </button>
        </div>
      ) : null}
      {groups.map((group) => (
        <section key={group.role?.id ?? "shared"} className="space-y-8">
          <Eyebrow as="h3" tone={group.role ? "text" : "muted"}>
            {group.role ? `${group.role.name} questions` : "For everyone"}
          </Eyebrow>
          <ol className="space-y-8">
            {group.questions.map((question) => {
              const name = answerField(question);
              return (
                <li key={question.id} className="[&_label]:text-base [&_legend]:text-base">
                  <QuestionField
                    question={question}
                    name={name}
                    value={values?.[name] ?? answers[question.id]}
                    error={errors[name]}
                  />
                </li>
              );
            })}
          </ol>
        </section>
      ))}
      {groups.length === 0 ? (
        <p className="text-sm text-muted">
          [TODO: no questions are configured for this cycle yet (supabase/seed.sql).]
        </p>
      ) : null}
    </div>
  );
}

function QuestionField({
  question,
  name,
  value,
  error,
}: {
  question: Question;
  name: string;
  value: AnswerValue | undefined;
  error?: string;
}) {
  const id = `apply-q-${question.slug}`;
  const options = (question.options ?? []).map((option) => ({ value: option, label: option }));
  const limit = `Up to ${answerMax(question).toLocaleString("en-US")} characters.`;
  const hint = question.help ? `${question.help} ${limit}` : limit;
  switch (question.kind) {
    case "select":
      return (
        <ChoiceField
          id={id}
          name={name}
          legend={question.prompt}
          options={options}
          hint={question.help ?? undefined}
          defaultValue={stringValue(value)}
          required={question.required}
          error={error}
        />
      );
    case "multiselect":
      return (
        <CheckboxGroupField
          id={id}
          name={name}
          legend={question.prompt}
          options={options}
          hint={question.help ?? undefined}
          defaultValue={listValue(value)}
          required={question.required}
          error={error}
        />
      );
    case "url":
      return (
        <TextField
          id={id}
          name={name}
          label={question.prompt}
          hint={question.help ?? undefined}
          required={question.required}
          inputMode="url"
          autoCapitalize="off"
          spellCheck={false}
          placeholder="https://"
          maxLength={URL_MAX}
          defaultValue={stringValue(value)}
          error={error}
        />
      );
    case "text":
      return (
        <TextField
          id={id}
          name={name}
          label={question.prompt}
          hint={hint}
          required={question.required}
          maxLength={answerMax(question)}
          defaultValue={stringValue(value)}
          error={error}
        />
      );
    default:
      return (
        <CountedTextArea
          id={id}
          name={name}
          label={question.prompt}
          hint={hint}
          required={question.required}
          maxLength={answerMax(question)}
          defaultValue={stringValue(value)}
          error={error}
        />
      );
  }
}
