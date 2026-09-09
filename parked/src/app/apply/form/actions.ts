"use server";

import type { PostgrestError } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { sendApplicationConfirmation } from "@/lib/apply/email";
import {
  answerField,
  answerSchema,
  applicationProblems,
  isEmptyAnswer,
  parseNav,
  parseStep,
  PROFILE_FIELDS,
  profileSchema,
  relevantQuestions,
  stepAfter,
  stepBefore,
  type AnswerValue,
  type ApplicationRow,
  type ApplyStep,
  type NavTarget,
  type ProfileField,
  type Question,
  type Role,
} from "@/lib/apply/schema";
import type { ApplyFormState, AutosaveResult } from "@/lib/apply/state";
import { getSessionUser, type SessionUser } from "@/lib/auth/session";
import {
  formatCycleDeadline,
  formatPortalDate,
  getActiveCycle,
  getMyApplicationDetail,
  getOpenRoles,
  getQuestions,
  isCycleOpen,
  type Cycle,
} from "@/lib/portal/data";
import { createClient, type PortalClient } from "@/lib/supabase/server";

/**
 * Server actions behind the application form (PLAN.md section 5). Every write runs as the
 * signed-in user through Row Level Security, which is what enforces "own draft, open cycle";
 * the code here validates the input, keeps the draft's rows in step and turns database
 * refusals into messages. Nothing trusts an id from the client: the application is looked
 * up by account and cycle.
 *
 * Saving is lenient (empty fields are fine, invalid ones are reported and skipped) so a
 * draft can be left half-done. "Continue" validates the step strictly; "submit" validates
 * the whole application against what the database holds.
 */

const SIGN_IN = "/apply?next=%2Fapply%2Fform";
const CHECK_MESSAGE = "Please check the highlighted fields.";
const SUBMITTED_MESSAGE =
  "This application has already been submitted and can no longer be changed.";

type Context = {
  supabase: PortalClient;
  user: SessionUser;
  cycle: Cycle;
  roles: Role[];
  questions: Question[];
  application: ApplicationRow | null;
  answers: Record<string, AnswerValue>;
};

async function loadContext(): Promise<Context> {
  const user = await getSessionUser();
  if (!user) redirect(SIGN_IN);
  const cycle = await getActiveCycle();
  if (!cycle) redirect("/apply");
  const [roles, questions, detail, supabase] = await Promise.all([
    getOpenRoles(cycle.id),
    getQuestions(cycle.id),
    getMyApplicationDetail(cycle.id, user.id),
    createClient(),
  ]);
  return {
    supabase,
    user,
    cycle,
    roles,
    questions,
    application: detail?.application ?? null,
    answers: detail?.answers ?? {},
  };
}

function stepUrl(step: ApplyStep): string {
  return `/apply/form?step=${step}#application-form`;
}

/** Where a saved step goes next. */
function destination(nav: NavTarget, step: ApplyStep): string {
  switch (nav) {
    case "continue":
      return stepUrl(stepAfter(step) ?? "review");
    case "back": {
      const before = stepBefore(step);
      return before ? stepUrl(before) : "/apply";
    }
    case "exit":
      return "/apply";
    case "submit":
      return stepUrl("review");
    default:
      return stepUrl(nav);
  }
}

function closedMessage(cycle: Cycle): string {
  return `Applications closed ${formatCycleDeadline(cycle)}, so this draft can no longer be changed.`;
}

/** The guard trigger's messages are written for people; anything else gets a generic one. */
function saveFailureMessage(error: PostgrestError, cycle: Cycle): string {
  if (error.code === "P0001") {
    const text = error.message.trim();
    return `${text.charAt(0).toUpperCase()}${text.slice(1)}.`;
  }
  if (!isCycleOpen(cycle)) return closedMessage(cycle);
  console.error("[apply] save failed:", error.code, error.message);
  return "We couldn't save just now. Your answers are still on this page; try again in a moment.";
}

type Ensured = { ok: true; application: ApplicationRow } | { ok: false; failure: string };

/** The draft to write to, created on the first save. */
async function ensureApplication(ctx: Context): Promise<Ensured> {
  if (ctx.application) {
    return ctx.application.status === "draft"
      ? { ok: true, application: ctx.application }
      : { ok: false, failure: SUBMITTED_MESSAGE };
  }
  if (!isCycleOpen(ctx.cycle)) return { ok: false, failure: closedMessage(ctx.cycle) };
  const { data, error } = await ctx.supabase
    .from("applications")
    .insert({ user_id: ctx.user.id, cycle_id: ctx.cycle.id })
    .select("*")
    .single();
  if (!error) return { ok: true, application: data };
  if (error.code === "23505") {
    // Created meanwhile (another tab): read it back.
    const { data: existing } = await ctx.supabase
      .from("applications")
      .select("*")
      .eq("cycle_id", ctx.cycle.id)
      .eq("user_id", ctx.user.id)
      .maybeSingle();
    if (existing) {
      return existing.status === "draft"
        ? { ok: true, application: existing }
        : { ok: false, failure: SUBMITTED_MESSAGE };
    }
  }
  return { ok: false, failure: saveFailureMessage(error, ctx.cycle) };
}

/** Updates the draft; a refused row (closed cycle, submitted meanwhile) comes back as 0 rows. */
async function updateApplication(
  ctx: Context,
  id: string,
  patch: Partial<ApplicationRow>,
): Promise<string | null> {
  const { data, error } = await ctx.supabase
    .from("applications")
    .update(patch)
    .eq("id", id)
    .select("id");
  if (error) return saveFailureMessage(error, ctx.cycle);
  if (data.length === 0) {
    return isCycleOpen(ctx.cycle) ? SUBMITTED_MESSAGE : closedMessage(ctx.cycle);
  }
  return null;
}

type Persisted = {
  fieldErrors: Record<string, string>;
  /** Raw values as submitted, echoed back to the form. */
  values: Record<string, AnswerValue>;
  /** A save that failed as a whole (closed cycle, already submitted, database error). */
  failure?: string;
};

function firstMessage(issues: { message: string }[], fallback: string): string {
  return issues[0]?.message ?? fallback;
}

async function persistProfile(
  ctx: Context,
  formData: FormData,
  strict: boolean,
): Promise<Persisted> {
  const values: Record<string, string> = {};
  for (const field of PROFILE_FIELDS) values[field] = String(formData.get(field) ?? "");

  const lenient = profileSchema(false).shape;
  const checked = profileSchema(strict).shape;
  const fieldErrors: Record<string, string> = {};
  const patch: Partial<Record<ProfileField, string | null>> = {};
  for (const field of PROFILE_FIELDS) {
    const saved = lenient[field].safeParse(values[field]);
    if (saved.success) patch[field] = saved.data === "" ? null : saved.data;
    const result = strict ? checked[field].safeParse(values[field]) : saved;
    if (!result.success)
      fieldErrors[field] = firstMessage(result.error.issues, "Check this field.");
  }

  const ensured = await ensureApplication(ctx);
  if (!ensured.ok) return { fieldErrors, values, failure: ensured.failure };
  const failure = await updateApplication(ctx, ensured.application.id, patch);
  if (failure) return { fieldErrors, values, failure };
  if (patch.full_name !== undefined) {
    // Keep the account's profile name in step; best effort, the application row is the record.
    const { error } = await ctx.supabase
      .from("profiles")
      .update({ full_name: patch.full_name })
      .eq("id", ctx.user.id);
    if (error) console.error("[apply] profile name update failed:", error.code, error.message);
  }
  return { fieldErrors, values };
}

async function persistRoles(ctx: Context, formData: FormData, strict: boolean): Promise<Persisted> {
  const openIds = new Set(ctx.roles.map((role) => role.id));
  const picked = Array.from(
    new Set(
      formData
        .getAll("roles")
        .filter((value): value is string => typeof value === "string" && openIds.has(value)),
    ),
  );
  const values = { roles: picked };
  const fieldErrors: Record<string, string> =
    strict && picked.length === 0 ? { roles: "Pick at least one role." } : {};

  const ensured = await ensureApplication(ctx);
  if (!ensured.ok) return { fieldErrors, values, failure: ensured.failure };
  const failure = await updateApplication(ctx, ensured.application.id, { roles_applied: picked });
  return failure ? { fieldErrors, values, failure } : { fieldErrors, values };
}

async function persistQuestions(
  ctx: Context,
  formData: FormData,
  strict: boolean,
): Promise<Persisted> {
  const ensured = await ensureApplication(ctx);
  const rolesApplied = ensured.ok ? ensured.application.roles_applied : [];
  const relevant = relevantQuestions(ctx.questions, rolesApplied);

  const values: Record<string, AnswerValue> = {};
  const fieldErrors: Record<string, string> = {};
  const upserts: { application_id: string; question_id: string; value: AnswerValue }[] = [];
  const clears: string[] = [];
  const applicationId = ensured.ok ? ensured.application.id : "";
  for (const question of relevant) {
    const name = answerField(question);
    const raw: AnswerValue =
      question.kind === "multiselect"
        ? formData.getAll(name).filter((value): value is string => typeof value === "string")
        : String(formData.get(name) ?? "");
    values[name] = raw;
    const saved = answerSchema(question, false).safeParse(raw);
    if (saved.success) {
      if (isEmptyAnswer(saved.data)) clears.push(question.id);
      else
        upserts.push({
          application_id: applicationId,
          question_id: question.id,
          value: saved.data,
        });
    }
    const result = strict ? answerSchema(question, true).safeParse(raw) : saved;
    if (!result.success)
      fieldErrors[name] = firstMessage(result.error.issues, "Check this answer.");
  }
  if (!ensured.ok) return { fieldErrors, values, failure: ensured.failure };

  if (upserts.length > 0) {
    const { error } = await ctx.supabase
      .from("answers")
      .upsert(upserts, { onConflict: "application_id,question_id" });
    if (error) return { fieldErrors, values, failure: saveFailureMessage(error, ctx.cycle) };
  }
  if (clears.length > 0) {
    const { error } = await ctx.supabase
      .from("answers")
      .delete()
      .eq("application_id", applicationId)
      .in("question_id", clears);
    if (error) return { fieldErrors, values, failure: saveFailureMessage(error, ctx.cycle) };
  }
  return { fieldErrors, values };
}

function persistStep(
  ctx: Context,
  step: ApplyStep,
  formData: FormData,
  strict: boolean,
): Promise<Persisted> {
  switch (step) {
    case "profile":
      return persistProfile(ctx, formData, strict);
    case "roles":
      return persistRoles(ctx, formData, strict);
    case "questions":
      return persistQuestions(ctx, formData, strict);
    default:
      return Promise.resolve({ fieldErrors: {}, values: {} });
  }
}

/**
 * Submits the draft: everything must validate against what the database holds (not the
 * form), answers to questions of roles no longer applied for are dropped, the status flips
 * (the guard trigger stamps submitted_at) and a confirmation email goes out when Resend is
 * configured. Redirects to /apply/submitted.
 */
async function submit(ctx: Context, formData: FormData): Promise<ApplyFormState> {
  const values = { confirm: String(formData.get("confirm") ?? "") };
  const failed = (
    message: string,
    extra: Partial<Extract<ApplyFormState, { status: "error" }>> = {},
  ): ApplyFormState => ({
    status: "error",
    at: Date.now(),
    step: "review",
    message,
    values,
    ...extra,
  });

  const { application } = ctx;
  if (!application) redirect(stepUrl("profile"));
  if (application.status !== "draft") redirect("/apply/submitted");
  if (!isCycleOpen(ctx.cycle)) return failed(closedMessage(ctx.cycle));

  const problems = applicationProblems(application, ctx.roles, ctx.questions, ctx.answers);
  if (problems.length > 0) {
    return failed("A few things need finishing before you can submit.", { problems });
  }
  if (values.confirm !== "1") {
    return failed("Tick the box to confirm your application is ready.", {
      fieldErrors: { confirm: "Tick this box to submit." },
    });
  }

  const relevantIds = new Set(
    relevantQuestions(ctx.questions, application.roles_applied).map((question) => question.id),
  );
  const stale = Object.keys(ctx.answers).filter((id) => !relevantIds.has(id));
  if (stale.length > 0) {
    const { error } = await ctx.supabase
      .from("answers")
      .delete()
      .eq("application_id", application.id)
      .in("question_id", stale);
    if (error) return failed(saveFailureMessage(error, ctx.cycle));
  }

  const { data, error } = await ctx.supabase
    .from("applications")
    .update({ status: "submitted" })
    .eq("id", application.id)
    .eq("status", "draft")
    .select("submitted_at, full_name, roles_applied")
    .maybeSingle();
  if (error) return failed(saveFailureMessage(error, ctx.cycle));
  if (!data) return failed(isCycleOpen(ctx.cycle) ? SUBMITTED_MESSAGE : closedMessage(ctx.cycle));

  const mailed = ctx.user.email
    ? await sendApplicationConfirmation({
        to: ctx.user.email,
        name: data.full_name,
        cycleName: ctx.cycle.name,
        roles: ctx.roles
          .filter((role) => data.roles_applied.includes(role.id))
          .map((role) => role.name),
        submittedAt: formatPortalDate(data.submitted_at ?? new Date()),
      })
    : false;
  redirect(mailed ? "/apply/submitted?mail=sent" : "/apply/submitted");
}

/**
 * The step form's action. The submit button's `nav` value says what to do after saving the
 * step: continue (strict), go back, leave, jump to a step, or submit the application.
 * Returns UI state on a problem, redirects on success. Works without JavaScript.
 */
export async function saveApplicationStep(
  _previous: ApplyFormState,
  formData: FormData,
): Promise<ApplyFormState> {
  const step = parseStep(formData.get("step"));
  const nav = parseNav(formData.get("nav"));
  const ctx = await loadContext();
  if (nav === "submit") return submit(ctx, formData);

  const result = await persistStep(ctx, step, formData, nav === "continue");
  if (result.failure) {
    return {
      status: "error",
      at: Date.now(),
      step,
      message: result.failure,
      values: result.values,
    };
  }
  if (Object.keys(result.fieldErrors).length > 0) {
    return {
      status: "error",
      at: Date.now(),
      step,
      message: CHECK_MESSAGE,
      fieldErrors: result.fieldErrors,
      values: result.values,
    };
  }
  redirect(destination(nav, step));
}

/** Autosave (called directly on blur / change): lenient save, never a navigation. */
export async function autosaveApplicationStep(formData: FormData): Promise<AutosaveResult> {
  const step = parseStep(formData.get("step"));
  const ctx = await loadContext();
  const result = await persistStep(ctx, step, formData, false);
  if (result.failure) return { status: "error", message: result.failure };
  return {
    status: "saved",
    at: new Date().toISOString(),
    fieldErrors: Object.keys(result.fieldErrors).length > 0 ? result.fieldErrors : undefined,
  };
}
