import { z } from "zod";
import type { Database } from "@/lib/supabase/database.types";

/**
 * Application form contract (PLAN.md section 5), shared by the client form (native hints,
 * counters, prefilled values) and the server actions (authoritative validation). No server
 * imports here.
 *
 * Four steps: profile (columns of public.applications), roles (roles_applied), questions
 * (one public.answers row per question) and review (submit). Saving is lenient so a draft
 * can be left half-done: empty fields are fine, invalid ones are not. "Continue" and the
 * final submit validate strictly, so required fields are enforced only when moving on.
 */

type Tables = Database["public"]["Tables"];
export type Question = Tables["questions"]["Row"];
export type Role = Tables["roles"]["Row"];
export type ApplicationRow = Tables["applications"]["Row"];

// ------------------------------------------------------------------------------ steps

export const APPLY_STEPS = ["profile", "roles", "questions", "review"] as const;
export type ApplyStep = (typeof APPLY_STEPS)[number];

export const STEP_TITLES: Record<ApplyStep, string> = {
  profile: "Profile",
  roles: "Roles",
  questions: "Questions",
  review: "Review",
};

export function isStep(value: unknown): value is ApplyStep {
  return typeof value === "string" && (APPLY_STEPS as readonly string[]).includes(value);
}

export function parseStep(value: unknown): ApplyStep {
  return isStep(value) ? value : "profile";
}

export function stepAfter(step: ApplyStep): ApplyStep | null {
  return APPLY_STEPS[APPLY_STEPS.indexOf(step) + 1] ?? null;
}

export function stepBefore(step: ApplyStep): ApplyStep | null {
  return APPLY_STEPS[APPLY_STEPS.indexOf(step) - 1] ?? null;
}

/**
 * What a submit button asks for, in its `nav` value: move on, go back, leave for now, submit
 * the application, or jump to a step. Every one of them saves the current step first.
 */
export const NAV_TARGETS = ["continue", "back", "exit", "submit", ...APPLY_STEPS] as const;
export type NavTarget = (typeof NAV_TARGETS)[number];

export function parseNav(value: unknown): NavTarget {
  return typeof value === "string" && (NAV_TARGETS as readonly string[]).includes(value)
    ? (value as NavTarget)
    : "continue";
}

// ------------------------------------------------------------------------------ profile

export const YEARS = [
  "First year",
  "Sophomore",
  "Junior",
  "Senior",
  "Graduate student",
  "Other",
] as const;

export const NAME_MAX = 120;
export const EMAIL_MAX = 254;
export const MAJOR_MAX = 120;
export const URL_MAX = 300;
/** Cap for answers to questions without max_chars (the column allows up to 20,000). */
export const ANSWER_MAX = 20000;

export const PROFILE_FIELDS = [
  "full_name",
  "purdue_email",
  "year",
  "major",
  "linkedin_url",
  "portfolio_url",
] as const;
export type ProfileField = (typeof PROFILE_FIELDS)[number];

export const PROFILE_LABELS: Record<ProfileField, string> = {
  full_name: "Name",
  purdue_email: "Purdue email",
  year: "Year",
  major: "Major",
  linkedin_url: "LinkedIn",
  portfolio_url: "Portfolio",
};

function tooLong(what: string, max: number): string {
  return `Keep ${what} under ${max.toLocaleString("en-US")} characters.`;
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (url.protocol === "http:" || url.protocol === "https:") && url.hostname.includes(".");
  } catch {
    return false;
  }
}

/** "" stays empty; anything else must be a full http(s) link. A missing scheme gets https://. */
function linkSchema(error: string) {
  return z
    .string()
    .trim()
    .max(URL_MAX, tooLong("the link", URL_MAX))
    .transform((value) =>
      value === "" || /^[a-z][a-z0-9+.-]*:/i.test(value) ? value : `https://${value}`,
    )
    .refine((value) => value === "" || isHttpUrl(value), { error });
}

const emailShape = z.email();

function domainOf(email: string): string {
  return email.slice(email.lastIndexOf("@") + 1);
}

const purdueEmailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(EMAIL_MAX, "That email address is too long.")
  .refine((value) => value === "" || emailShape.safeParse(value).success, {
    error: "Enter a valid email address.",
  })
  .refine((value) => value === "" || /(^|\.)purdue\.edu$/.test(domainOf(value)), {
    error: "Use an address that ends in purdue.edu.",
  });

/**
 * Step 1. Every field parses to a string ("" = empty); the action turns "" into null for
 * the database. `strict` adds the required checks.
 */
export function profileSchema(strict: boolean) {
  const required = <T extends z.ZodType<string, string>>(schema: T, message: string) =>
    strict ? schema.refine((value) => value !== "", { error: message }) : schema;
  return z.object({
    full_name: required(
      z.string().trim().max(NAME_MAX, tooLong("your name", NAME_MAX)),
      "Tell us your name.",
    ),
    purdue_email: purdueEmailSchema,
    year: required(
      z
        .string()
        .trim()
        .refine((value) => value === "" || (YEARS as readonly string[]).includes(value), {
          error: "Pick your year.",
        }),
      "Pick your year.",
    ),
    major: required(
      z.string().trim().max(MAJOR_MAX, tooLong("your major", MAJOR_MAX)),
      "Tell us your major.",
    ),
    linkedin_url: linkSchema("Enter a full link, like https://linkedin.com/in/you."),
    portfolio_url: linkSchema("Enter a full link, like https://your-site.com."),
  });
}

export type ProfileValues = Record<ProfileField, string>;

/** The profile columns of an application as form values ("" for null). */
export function profileValuesOf(application: ApplicationRow | null): ProfileValues {
  const values = {} as ProfileValues;
  for (const field of PROFILE_FIELDS) values[field] = application?.[field] ?? "";
  return values;
}

// ------------------------------------------------------------------------------ answers

/** A string, or a list of strings for multiselect questions (stored as jsonb). */
export type AnswerValue = string | string[];

export function isEmptyAnswer(value: AnswerValue | null | undefined): boolean {
  if (value == null) return true;
  return Array.isArray(value) ? value.length === 0 : value.trim() === "";
}

/** Reads what the database stored back into a string or list; anything odd becomes empty. */
export function normaliseAnswer(value: unknown): AnswerValue {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string");
  return "";
}

export function emptyAnswer(question: Pick<Question, "kind">): AnswerValue {
  return question.kind === "multiselect" ? [] : "";
}

export function answerMax(question: Pick<Question, "max_chars">): number {
  return question.max_chars ?? ANSWER_MAX;
}

/**
 * Validation for one question, built from its row. Text kinds parse to a string ("" =
 * empty), multiselect to a list. `strict` enforces `required`.
 */
export function answerSchema(
  question: Pick<Question, "kind" | "options" | "max_chars" | "required">,
  strict: boolean,
): z.ZodType<AnswerValue, unknown> {
  const must = strict && question.required;
  const options = question.options ?? [];
  switch (question.kind) {
    case "multiselect": {
      const list = z
        .array(z.string())
        .transform((values) => Array.from(new Set(values.filter((v) => options.includes(v)))));
      return must
        ? list.refine((values) => values.length > 0, { error: "Pick at least one." })
        : list;
    }
    case "select": {
      const choice = z
        .string()
        .trim()
        .refine((value) => value === "" || options.includes(value), {
          error: "Pick one of the options.",
        });
      return must
        ? choice.refine((value) => value !== "", { error: "Pick one of the options." })
        : choice;
    }
    case "url": {
      const link = linkSchema("Enter a full link, like https://your-site.com.");
      return must ? link.refine((value) => value !== "", { error: "Add a link." }) : link;
    }
    default: {
      const max = answerMax(question);
      const text = z
        .string()
        .transform((value) => value.replace(/\r\n?/g, "\n").trim())
        .pipe(z.string().max(max, tooLong("this answer", max)));
      return must ? text.refine((value) => value !== "", { error: "This one is required." }) : text;
    }
  }
}

/** Form field name for a question. */
export function answerField(question: Pick<Question, "id">): string {
  return `q:${question.id}`;
}

function bySort(a: Question, b: Question): number {
  return a.sort - b.sort;
}

/** Shared questions plus those of the roles applied for, in `sort` order. */
export function relevantQuestions(
  questions: readonly Question[],
  rolesApplied: readonly string[],
): Question[] {
  const applied = new Set(rolesApplied);
  return questions
    .filter((question) => question.role_id === null || applied.has(question.role_id))
    .sort(bySort);
}

/** What the grouping and summaries need from a role (the client form has just this). */
export type RoleLike = Pick<Role, "id" | "name">;

export type QuestionGroup<R extends RoleLike = RoleLike> = {
  role: R | null;
  questions: Question[];
};

/** The questions step: one group for everyone, then one per role applied for (in role order). */
export function groupQuestions<R extends RoleLike>(
  questions: readonly Question[],
  roles: readonly R[],
  rolesApplied: readonly string[],
): QuestionGroup<R>[] {
  const applied = new Set(rolesApplied);
  const groups: QuestionGroup<R>[] = [];
  const shared = questions.filter((question) => question.role_id === null).sort(bySort);
  if (shared.length > 0) groups.push({ role: null, questions: shared });
  for (const role of roles) {
    if (!applied.has(role.id)) continue;
    const own = questions.filter((question) => question.role_id === role.id).sort(bySort);
    if (own.length > 0) groups.push({ role, questions: own });
  }
  return groups;
}

// ------------------------------------------------------------------------------ completeness

export type Problem = { step: ApplyStep; message: string };

function shortPrompt(prompt: string): string {
  return prompt.length > 70 ? `${prompt.slice(0, 67).trimEnd()}…` : prompt;
}

/**
 * Everything that still stops the application from being submitted, per step, using the
 * strict schemas against what the database holds. Empty means ready.
 */
export function applicationProblems(
  application: ApplicationRow | null,
  roles: readonly RoleLike[],
  questions: readonly Question[],
  answers: Readonly<Record<string, AnswerValue>>,
): Problem[] {
  if (!application) {
    return [
      { step: "profile", message: "Fill in your profile." },
      { step: "roles", message: "Pick at least one role." },
    ];
  }
  const problems: Problem[] = [];
  const profile = profileSchema(true).safeParse(profileValuesOf(application));
  if (!profile.success) {
    const seen = new Set<string>();
    for (const issue of profile.error.issues) {
      const field = issue.path[0];
      if (typeof field !== "string" || seen.has(field)) continue;
      seen.add(field);
      problems.push({
        step: "profile",
        message: `${PROFILE_LABELS[field as ProfileField] ?? field}: ${issue.message}`,
      });
    }
  }
  const openIds = new Set(roles.map((role) => role.id));
  const applied = application.roles_applied.filter((id) => openIds.has(id));
  if (applied.length === 0) problems.push({ step: "roles", message: "Pick at least one role." });
  for (const question of relevantQuestions(questions, applied)) {
    const result = answerSchema(question, true).safeParse(
      answers[question.id] ?? emptyAnswer(question),
    );
    if (!result.success) {
      problems.push({
        step: "questions",
        message: `${shortPrompt(question.prompt)} ${result.error.issues[0]?.message ?? ""}`.trim(),
      });
    }
  }
  return problems;
}

/** Steps that show a check in the stepper. */
export function completedSteps(
  application: ApplicationRow | null,
  roles: readonly RoleLike[],
  questions: readonly Question[],
  answers: Readonly<Record<string, AnswerValue>>,
): ApplyStep[] {
  if (!application) return [];
  const problems = applicationProblems(application, roles, questions, answers);
  const broken = new Set(problems.map((problem) => problem.step));
  const done: ApplyStep[] = [];
  if (!broken.has("profile")) done.push("profile");
  if (!broken.has("roles")) done.push("roles");
  if (!broken.has("roles") && !broken.has("questions")) done.push("questions");
  return done;
}

// ------------------------------------------------------------------------------ summary

export type SummaryItem = {
  id: string;
  label: string;
  value: AnswerValue | null;
  kind: "text" | "link" | "list";
  required: boolean;
};

export type SummaryGroup = { step: ApplyStep; title: string; items: SummaryItem[] };

/** The review step and the read-only view, as plain data (no server imports needed). */
export function buildSummary(
  application: ApplicationRow | null,
  roles: readonly RoleLike[],
  questions: readonly Question[],
  answers: Readonly<Record<string, AnswerValue>>,
): SummaryGroup[] {
  const profile = profileValuesOf(application);
  const groups: SummaryGroup[] = [
    {
      step: "profile",
      title: "Profile",
      items: PROFILE_FIELDS.map((field) => ({
        id: field,
        label: PROFILE_LABELS[field],
        value: profile[field] || null,
        kind: field.endsWith("_url") ? "link" : "text",
        required: field === "full_name" || field === "year" || field === "major",
      })),
    },
  ];
  const openIds = new Set(roles.map((role) => role.id));
  const applied = (application?.roles_applied ?? []).filter((id) => openIds.has(id));
  groups.push({
    step: "roles",
    title: "Roles",
    items: [
      {
        id: "roles",
        label: "Applying as",
        value: roles.filter((role) => applied.includes(role.id)).map((role) => role.name),
        kind: "list",
        required: true,
      },
    ],
  });
  for (const group of groupQuestions(questions, roles, applied)) {
    groups.push({
      step: "questions",
      title: group.role ? `${group.role.name} questions` : "Questions for everyone",
      items: group.questions.map((question) => ({
        id: question.id,
        label: question.prompt,
        value: answers[question.id] ?? null,
        kind: question.kind === "multiselect" ? "list" : question.kind === "url" ? "link" : "text",
        required: question.required,
      })),
    });
  }
  return groups;
}
