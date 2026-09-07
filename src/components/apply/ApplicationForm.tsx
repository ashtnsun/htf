"use client";

import { Check } from "lucide-react";
import {
  useActionState,
  useEffect,
  useRef,
  useState,
  useTransition,
  type FocusEvent,
  type FormEvent,
} from "react";
import { autosaveApplicationStep, saveApplicationStep } from "@/app/apply/form/actions";
import { ApplicationSummary } from "@/components/apply/ApplicationSummary";
import { ProfileStep, QuestionsStep, RolesStep } from "@/components/apply/ApplicationSteps";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { CheckboxField } from "@/components/ui/Field";
import { SplitButton } from "@/components/ui/SplitButton";
import {
  APPLY_STEPS,
  STEP_TITLES,
  type AnswerValue,
  type ApplyStep,
  type Problem,
  type ProfileValues,
  type Question,
  type SummaryGroup,
} from "@/lib/apply/schema";
import { APPLY_FORM_IDLE } from "@/lib/apply/state";
import { formatPortalDate, formatPortalTime } from "@/lib/portal/format";
import { cn } from "@/lib/utils";

export const FORM_ID = "apply-step-form";

export type FormRole = {
  id: string;
  name: string;
  description: string | null;
  questionCount: number;
};

export type ApplicationFormProps = {
  step: ApplyStep;
  cycleName: string;
  /** Formatted deadline. */
  deadline: string;
  /** The account's email (the profile step explains where decisions go). */
  email: string;
  roles: FormRole[];
  questions: Question[];
  /** The saved draft, or null before the first save. */
  draft: { profile: ProfileValues; rolesApplied: string[]; updatedAt: string } | null;
  answers: Record<string, AnswerValue>;
  completed: ApplyStep[];
  /** What still stops the application from being submitted (review step). */
  problems: Problem[];
  summary: SummaryGroup[];
};

type SaveStatus =
  | { kind: "idle" }
  | { kind: "saving" }
  | { kind: "saved"; at: number; time: string; fieldErrors?: Record<string, string> }
  | { kind: "error"; at: number; message: string };

const STEP_INTROS: Record<ApplyStep, string> = {
  profile: "Who you are. We follow up at the email you signed in with.",
  roles: "Pick every role you'd like to be considered for. One application covers them all.",
  questions: "Short answers are fine. Everything saves as you go.",
  review: "Check everything, then submit. Nothing can be changed after that.",
};

const textButton =
  "min-h-11 text-sm text-muted underline decoration-green/70 underline-offset-4 transition-colors hover:text-green disabled:opacity-60";

function isField(target: EventTarget | null): boolean {
  if (target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) return true;
  return (
    target instanceof HTMLInputElement &&
    !["submit", "button", "hidden", "checkbox", "radio"].includes(target.type)
  );
}

function isToggle(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLInputElement && (target.type === "checkbox" || target.type === "radio")
  );
}

/** What the form holds, minus the button that submitted it, for change detection. */
function snapshot(form: HTMLFormElement): string {
  const entries = Array.from(new FormData(form).entries())
    .filter(([name]) => name !== "nav")
    .map(([name, value]) => [name, String(value)]);
  return JSON.stringify(entries);
}

/**
 * The multi-step application form. One <form> per step; its buttons all post to the same
 * server action with a `nav` value (continue, back, exit, submit or a step name), so every
 * move saves first and the form works without JavaScript. With JavaScript, leaving a field
 * or toggling a choice autosaves in the background and the aside says so.
 */
export function ApplicationForm({
  step,
  cycleName,
  deadline,
  email,
  roles,
  questions,
  draft,
  answers,
  completed,
  problems: savedProblems,
  summary,
}: ApplicationFormProps) {
  const [state, formAction, pending] = useActionState(saveApplicationStep, APPLY_FORM_IDLE);
  const [save, setSave] = useState<SaveStatus>({ kind: "idle" });
  const [, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const lastSaved = useRef<string | null>(null);

  // Errors and echoed values come from whichever ran last: the step submit or an autosave.
  const submitAt = state.status === "error" ? state.at : 0;
  const saveAt = save.kind === "saved" || save.kind === "error" ? save.at : 0;
  const fieldErrors: Record<string, string> =
    submitAt >= saveAt
      ? state.status === "error"
        ? (state.fieldErrors ?? {})
        : {}
      : save.kind === "saved"
        ? (save.fieldErrors ?? {})
        : {};
  const values = state.status === "error" ? state.values : undefined;
  // The alert and the review's problem list clear once a later autosave has gone through.
  const message = state.status === "error" && submitAt >= saveAt ? state.message : null;
  const problems =
    state.status === "error" && submitAt >= saveAt && state.problems
      ? state.problems
      : savedProblems;

  useEffect(() => {
    if (formRef.current) lastSaved.current = snapshot(formRef.current);
  }, []);

  // Arriving from another step (the redirect carries #application-form): put the keyboard on
  // the step heading rather than back at the top of the page.
  useEffect(() => {
    if (window.location.hash === "#application-form") headingRef.current?.focus();
  }, []);

  // After a failed submit, focus the first invalid control (or the heading above the message).
  useEffect(() => {
    if (state.status !== "error") return;
    const invalid = formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]');
    if (invalid?.tagName === "FIELDSET") {
      invalid.querySelector<HTMLElement>("input")?.focus();
    } else if (invalid) {
      invalid.focus();
    } else {
      headingRef.current?.focus();
    }
  }, [state]);

  function autosave(form: HTMLFormElement) {
    if (step === "review" || pending) return;
    const current = snapshot(form);
    if (current === lastSaved.current) return;
    const formData = new FormData(form);
    startTransition(async () => {
      setSave({ kind: "saving" });
      const result = await autosaveApplicationStep(formData);
      if (result.status === "saved") {
        lastSaved.current = current;
        setSave({
          kind: "saved",
          at: Date.now(),
          time: formatPortalTime(result.at),
          fieldErrors: result.fieldErrors,
        });
      } else {
        setSave({ kind: "error", at: Date.now(), message: result.message });
      }
    });
  }

  function handleBlur(event: FocusEvent<HTMLFormElement>) {
    const next = event.relatedTarget;
    // Moving to one of the form's submit buttons: that click saves anyway.
    if (
      next instanceof HTMLButtonElement &&
      next.type === "submit" &&
      next.form === event.currentTarget
    ) {
      return;
    }
    if (isField(event.target)) autosave(event.currentTarget);
  }

  function handleChange(event: FormEvent<HTMLFormElement>) {
    if (isToggle(event.target)) autosave(event.currentTarget);
  }

  const saveLine =
    save.kind === "saving"
      ? "Saving…"
      : save.kind === "saved"
        ? `Saved ${save.time}`
        : save.kind === "error"
          ? `Couldn't save. ${save.message}`
          : draft
            ? `Last saved ${formatPortalDate(draft.updatedAt)}`
            : "Not saved yet";

  const stepNumber = APPLY_STEPS.indexOf(step) + 1;
  const ready = step === "review" && problems.length === 0;

  return (
    <div id="application-form" className="scroll-mt-28">
      <form
        ref={formRef}
        id={FORM_ID}
        action={formAction}
        onBlur={handleBlur}
        onChange={handleChange}
        className="grid gap-x-14 gap-y-10 lg:grid-cols-[minmax(0,1fr)_18rem] xl:gap-x-20"
      >
        {/* Pressing Enter in a field acts like "Continue" (the first submit button wins). */}
        <button type="submit" name="nav" value="continue" hidden tabIndex={-1} aria-hidden="true" />
        <input type="hidden" name="step" value={step} />

        <Stepper current={step} completed={completed} pending={pending} />

        <div className="min-w-0 space-y-8">
          {message ? (
            <p
              role="alert"
              className="border border-cyan/50 bg-surface px-4 py-3 text-sm text-text"
            >
              {message}
            </p>
          ) : null}

          <div>
            <Eyebrow tone="muted">
              Step {stepNumber} of {APPLY_STEPS.length}
            </Eyebrow>
            <h2
              ref={headingRef}
              id="apply-step-title"
              tabIndex={-1}
              className="mt-4 font-display text-h3 font-medium text-text outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-mint"
            >
              {STEP_TITLES[step]}
            </h2>
            <p className="mt-2 max-w-prose text-muted">{STEP_INTROS[step]}</p>
          </div>

          {step === "profile" ? (
            <ProfileStep
              profile={draft?.profile ?? null}
              email={email}
              values={values}
              errors={fieldErrors}
            />
          ) : step === "roles" ? (
            <RolesStep
              roles={roles}
              applied={draft?.rolesApplied ?? []}
              values={values}
              errors={fieldErrors}
            />
          ) : step === "questions" ? (
            <QuestionsStep
              roles={roles}
              questions={questions}
              applied={draft?.rolesApplied ?? []}
              answers={answers}
              values={values}
              errors={fieldErrors}
              pending={pending}
            />
          ) : (
            <ReviewStep
              summary={summary}
              problems={problems}
              confirmed={values?.confirm === "1"}
              error={fieldErrors.confirm}
              pending={pending}
            />
          )}

          <div className="flex flex-wrap items-center gap-x-6 gap-y-4 border-t border-line pt-8">
            {step === "review" ? (
              ready ? (
                <SplitButton type="submit" name="nav" value="submit" size="lg" pending={pending}>
                  {pending ? "Submitting" : "Submit application"}
                </SplitButton>
              ) : (
                <SplitButton
                  type="submit"
                  name="nav"
                  value={problems[0]?.step ?? "profile"}
                  size="lg"
                  variant="secondary"
                  pending={pending}
                >
                  Finish the missing parts
                </SplitButton>
              )
            ) : (
              <SplitButton type="submit" name="nav" value="continue" size="lg" pending={pending}>
                {pending ? "Saving" : "Continue"}
              </SplitButton>
            )}
            <button
              type="submit"
              name="nav"
              value="back"
              formNoValidate
              disabled={pending}
              className={textButton}
            >
              {step === "profile" ? "Back to your status" : "Back"}
            </button>
          </div>
        </div>

        <aside
          aria-labelledby="draft-title"
          className="self-start border border-line glass p-6 lg:sticky lg:top-28"
        >
          <Eyebrow tone="green">Your draft</Eyebrow>
          <p id="draft-title" className="mt-3 font-medium text-text">
            {cycleName} application
          </p>
          <p
            role="status"
            className={cn("mt-1 text-sm", save.kind === "error" ? "text-cyan" : "text-muted")}
          >
            {saveLine}
          </p>
          <p className="mt-5 text-sm text-muted">
            Applications close <span className="text-text">{deadline}</span>. Answers save when you
            leave a field or change step.
          </p>
          <button
            type="submit"
            name="nav"
            value="exit"
            formNoValidate
            disabled={pending}
            className={cn(textButton, "mt-5")}
          >
            Save and finish later
          </button>
        </aside>
      </form>
    </div>
  );
}

function Stepper({
  current,
  completed,
  pending,
}: {
  current: ApplyStep;
  completed: ApplyStep[];
  pending: boolean;
}) {
  return (
    <nav aria-label="Application steps" className="border-y border-line lg:col-span-2">
      <ol className="grid grid-cols-2 sm:grid-cols-4">
        {APPLY_STEPS.map((step, index) => {
          const isCurrent = step === current;
          const done = completed.includes(step);
          return (
            <li key={step} className="relative">
              <button
                type="submit"
                name="nav"
                value={step}
                formNoValidate
                disabled={pending}
                aria-current={isCurrent ? "step" : undefined}
                className={cn(
                  "flex min-h-14 w-full items-center gap-3 px-3 py-3 text-left text-sm transition-colors duration-200 focus-visible:outline-offset-[-3px] disabled:opacity-60 sm:px-4",
                  isCurrent ? "text-text" : "text-muted hover:text-text",
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "font-display text-base font-medium tabular-nums",
                    isCurrent || done ? "text-green" : "text-muted",
                  )}
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="flex items-center gap-2">
                  {STEP_TITLES[step]}
                  {done && !isCurrent ? (
                    <>
                      <Check className="size-4 text-green" aria-hidden="true" strokeWidth={2.5} />
                      <span className="sr-only">(complete)</span>
                    </>
                  ) : null}
                </span>
              </button>
              {isCurrent ? (
                <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-0.5 bg-green" />
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function ReviewStep({
  summary,
  problems,
  confirmed,
  error,
  pending,
}: {
  summary: SummaryGroup[];
  problems: Problem[];
  confirmed: boolean;
  error?: string;
  pending: boolean;
}) {
  return (
    <div className="space-y-10">
      {problems.length > 0 ? (
        <div className="border border-line bg-surface p-6">
          <Eyebrow tone="muted">Before you can submit</Eyebrow>
          <ul className="mt-4 space-y-3">
            {problems.map((problem, index) => (
              <li
                key={`${problem.step}-${index}`}
                className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm"
              >
                <span className="text-text">{problem.message}</span>
                <button
                  type="submit"
                  name="nav"
                  value={problem.step}
                  formNoValidate
                  disabled={pending}
                  className={textButton}
                >
                  Go to {STEP_TITLES[problem.step]}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <ApplicationSummary groups={summary} editable />

      {problems.length === 0 ? (
        <CheckboxField id="apply-confirm" name="confirm" defaultChecked={confirmed} error={error}>
          Everything above is accurate, and I understand I can&apos;t edit my application after
          submitting it.
        </CheckboxField>
      ) : null}
    </div>
  );
}
