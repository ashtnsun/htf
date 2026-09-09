import "server-only";
import { cache } from "react";
import { normaliseAnswer, type AnswerValue } from "@/lib/apply/schema";
import type { Database } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

export { formatCycleDeadline, formatPortalDate } from "./format";

/**
 * Reads for the application portal. Every query runs as the current request's user through
 * src/lib/supabase/server.ts, so Row Level Security decides what comes back: applicants see
 * their own application, admins see all of them, and the cycle definitions are public.
 */

type Tables = Database["public"]["Tables"];
export type Cycle = Tables["cycles"]["Row"];
export type Role = Tables["roles"]["Row"];
export type Question = Tables["questions"]["Row"];
export type ApplicationStatus = Database["public"]["Enums"]["application_status"];
export type Application = Tables["applications"]["Row"];
export type ApplicationSummary = Pick<
  Application,
  "id" | "status" | "roles_applied" | "submitted_at" | "updated_at" | "created_at"
>;
export type ApplicationDetail = {
  application: Application;
  /** Answers by question id, as stored (string, or list for multiselect). */
  answers: Record<string, AnswerValue>;
};

export const APPLICATION_STATUSES: readonly ApplicationStatus[] = [
  "draft",
  "submitted",
  "reviewing",
  "accepted",
  "rejected",
  "waitlisted",
];

function fail(what: string, message: string): never {
  throw new Error(`[portal] ${what} failed: ${message}`);
}

/** The one active cycle, or null while none is configured. */
export const getActiveCycle = cache(async (): Promise<Cycle | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cycles")
    .select("*")
    .eq("is_active", true)
    .maybeSingle();
  if (error) fail("cycles query", error.message);
  return data;
});

/** True while the cycle takes applications (same rule as cycle_is_open() in the database). */
export function isCycleOpen(cycle: Cycle, now: Date = new Date()): boolean {
  const t = now.getTime();
  return (
    cycle.is_active &&
    t >= new Date(cycle.opens_at).getTime() &&
    t < new Date(cycle.closes_at).getTime()
  );
}

export const getOpenRoles = cache(async (cycleId: string): Promise<Role[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("roles")
    .select("*")
    .eq("cycle_id", cycleId)
    .eq("is_open", true)
    .order("sort");
  if (error) fail("roles query", error.message);
  return data;
});

export const getQuestions = cache(async (cycleId: string): Promise<Question[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("questions")
    .select("*")
    .eq("cycle_id", cycleId)
    .order("sort");
  if (error) fail("questions query", error.message);
  return data;
});

/** The signed-in user's application for the cycle (RLS returns only their own), or null. */
export const getMyApplication = cache(
  async (cycleId: string, userId: string): Promise<ApplicationSummary | null> => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("applications")
      .select("id, status, roles_applied, submitted_at, updated_at, created_at")
      .eq("cycle_id", cycleId)
      .eq("user_id", userId)
      .maybeSingle();
    if (error) fail("application query", error.message);
    return data;
  },
);

/** The signed-in user's application with its answers (the form and the read-only view). */
export const getMyApplicationDetail = cache(
  async (cycleId: string, userId: string): Promise<ApplicationDetail | null> => {
    const supabase = await createClient();
    const { data: application, error } = await supabase
      .from("applications")
      .select("*")
      .eq("cycle_id", cycleId)
      .eq("user_id", userId)
      .maybeSingle();
    if (error) fail("application query", error.message);
    if (!application) return null;
    const { data: rows, error: answersError } = await supabase
      .from("answers")
      .select("question_id, value")
      .eq("application_id", application.id);
    if (answersError) fail("answers query", answersError.message);
    const answers: Record<string, AnswerValue> = {};
    for (const row of rows) answers[row.question_id] = normaliseAnswer(row.value);
    return { application, answers };
  },
);

/** Admin view: how many applications the cycle has in each status (RLS: admins see all). */
export async function countApplicationsByStatus(
  cycleId: string,
): Promise<Record<ApplicationStatus, number>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("applications")
    .select("status")
    .eq("cycle_id", cycleId);
  if (error) fail("application counts", error.message);
  const counts = Object.fromEntries(APPLICATION_STATUSES.map((s) => [s, 0])) as Record<
    ApplicationStatus,
    number
  >;
  for (const row of data) counts[row.status] += 1;
  return counts;
}
