import "server-only";
import {
  normaliseAnswer,
  YEARS,
  type AnswerValue,
  type Question,
  type Role,
} from "@/lib/apply/schema";
import type { Database } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";
import { APPLICATION_STATUSES, type Application, type ApplicationStatus, type Cycle } from "./data";

/**
 * Reads and helpers for the exec dashboard (PLAN.md section 5, Session 9). Everything runs as
 * the signed-in exec member through Row Level Security: the policies let admins read every
 * application, answer, profile and review, write their own review row and change an
 * application's status (the guard trigger allows nothing else). Pages and the CSV route call
 * these after `requireUser` + `isAdminUser`; a non-admin would simply get empty lists.
 */

type Tables = Database["public"]["Tables"];
export type Review = Tables["reviews"]["Row"];
export type ReviewDecision = Database["public"]["Enums"]["review_decision"];
export type Profile = Pick<Tables["profiles"]["Row"], "id" | "email" | "full_name">;

export const REVIEW_DECISIONS: readonly ReviewDecision[] = ["yes", "maybe", "no"];
export const DECISION_LABELS: Record<ReviewDecision, string> = {
  yes: "Yes",
  maybe: "Maybe",
  no: "No",
};
export const SCORES = [1, 2, 3, 4, 5] as const;

/** Statuses an exec member may set (the guard trigger refuses `draft`). */
export const ADMIN_STATUSES: readonly ApplicationStatus[] = [
  "submitted",
  "reviewing",
  "accepted",
  "rejected",
  "waitlisted",
];

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  reviewing: "Reviewing",
  accepted: "Accepted",
  rejected: "Rejected",
  waitlisted: "Waitlisted",
};

function fail(what: string, message: string): never {
  throw new Error(`[admin] ${what} failed: ${message}`);
}

/** A reviewer's row with who wrote it. */
export type ReviewWithReviewer = Review & { reviewer: Profile | null };

/** One line of the applications table. */
export type ApplicationListRow = {
  application: Application;
  /** Sign-in email from the profile (the application's purdue_email is separate). */
  email: string;
  /** Application name, else the profile name, else the email. */
  name: string;
  roleNames: string[];
  reviews: Review[];
  reviewCount: number;
  averageScore: number | null;
  /** The signed-in exec member's own review, if any. */
  mine: Review | null;
};

export type Dashboard = {
  cycle: Cycle;
  roles: Role[];
  questions: Question[];
  rows: ApplicationListRow[];
};

// ------------------------------------------------------------------------------ reads

/** Every role of the cycle, open or not, so old applications still show their role names. */
export async function getCycleRoles(cycleId: string): Promise<Role[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("roles")
    .select("*")
    .eq("cycle_id", cycleId)
    .order("sort");
  if (error) fail("roles query", error.message);
  return data;
}

async function getCycleQuestions(cycleId: string): Promise<Question[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("questions")
    .select("*")
    .eq("cycle_id", cycleId)
    .order("sort");
  if (error) fail("questions query", error.message);
  return data;
}

/** Profiles for a set of account ids, fetched in chunks so the query string stays short. */
export async function getProfiles(ids: readonly string[]): Promise<Map<string, Profile>> {
  const supabase = await createClient();
  const map = new Map<string, Profile>();
  const unique = Array.from(new Set(ids));
  for (let i = 0; i < unique.length; i += 150) {
    const chunk = unique.slice(i, i + 150);
    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, full_name")
      .in("id", chunk);
    if (error) fail("profiles query", error.message);
    for (const profile of data) map.set(profile.id, profile);
  }
  return map;
}

/** Reviews of every application in the cycle, grouped by application. */
async function getCycleReviews(cycleId: string): Promise<Map<string, Review[]>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reviews")
    .select("*, applications!inner(cycle_id)")
    .eq("applications.cycle_id", cycleId)
    .order("updated_at", { ascending: false });
  if (error) fail("reviews query", error.message);
  const map = new Map<string, Review[]>();
  for (const row of data) {
    const list = map.get(row.application_id) ?? [];
    list.push(row);
    map.set(row.application_id, list);
  }
  return map;
}

/** Every answer in the cycle (for the CSV), by application then question. */
export async function getCycleAnswers(
  cycleId: string,
): Promise<Map<string, Record<string, AnswerValue>>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("answers")
    .select("application_id, question_id, value, applications!inner(cycle_id)")
    .eq("applications.cycle_id", cycleId);
  if (error) fail("answers query", error.message);
  const map = new Map<string, Record<string, AnswerValue>>();
  for (const row of data) {
    const answers = map.get(row.application_id) ?? {};
    answers[row.question_id] = normaliseAnswer(row.value);
    map.set(row.application_id, answers);
  }
  return map;
}

export function averageScore(reviews: readonly Review[]): number | null {
  const scores = reviews.map((r) => r.score).filter((s): s is number => typeof s === "number");
  if (scores.length === 0) return null;
  return scores.reduce((sum, s) => sum + s, 0) / scores.length;
}

export function displayName(application: Application, profile: Profile | null | undefined) {
  return application.full_name || profile?.full_name || profile?.email || "Unnamed";
}

/** The whole cycle for the dashboard: applications with names, roles and review figures. */
export async function loadDashboard(cycle: Cycle, userId: string): Promise<Dashboard> {
  const supabase = await createClient();
  const [{ data: applications, error }, roles, questions, reviews] = await Promise.all([
    supabase.from("applications").select("*").eq("cycle_id", cycle.id),
    getCycleRoles(cycle.id),
    getCycleQuestions(cycle.id),
    getCycleReviews(cycle.id),
  ]);
  if (error) fail("applications query", error.message);
  const profiles = await getProfiles(applications.map((a) => a.user_id));
  const roleName = new Map(roles.map((role) => [role.id, role.name]));

  const rows: ApplicationListRow[] = applications.map((application) => {
    const profile = profiles.get(application.user_id) ?? null;
    const own = reviews.get(application.id) ?? [];
    return {
      application,
      email: profile?.email ?? "",
      name: displayName(application, profile),
      roleNames: roles
        .filter((role) => application.roles_applied.includes(role.id))
        .map((role) => roleName.get(role.id) ?? role.name),
      reviews: own,
      reviewCount: own.length,
      averageScore: averageScore(own),
      mine: own.find((review) => review.reviewer_id === userId) ?? null,
    };
  });
  return { cycle, roles, questions, rows };
}

/** One application for the review page, or null when RLS hides it (or it does not exist). */
export async function getApplicationForReview(id: string): Promise<{
  application: Application;
  profile: Profile | null;
  answers: Record<string, AnswerValue>;
  reviews: ReviewWithReviewer[];
} | null> {
  const supabase = await createClient();
  const { data: application, error } = await supabase
    .from("applications")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) fail("application query", error.message);
  if (!application) return null;
  const [{ data: answerRows, error: answersError }, { data: reviewRows, error: reviewsError }] =
    await Promise.all([
      supabase.from("answers").select("question_id, value").eq("application_id", id),
      supabase
        .from("reviews")
        .select("*")
        .eq("application_id", id)
        .order("updated_at", { ascending: false }),
    ]);
  if (answersError) fail("answers query", answersError.message);
  if (reviewsError) fail("reviews query", reviewsError.message);
  const profiles = await getProfiles([
    application.user_id,
    ...reviewRows.map((review) => review.reviewer_id),
  ]);
  const answers: Record<string, AnswerValue> = {};
  for (const row of answerRows) answers[row.question_id] = normaliseAnswer(row.value);
  return {
    application,
    profile: profiles.get(application.user_id) ?? null,
    answers,
    reviews: reviewRows.map((review) => ({
      ...review,
      reviewer: profiles.get(review.reviewer_id) ?? null,
    })),
  };
}

// ------------------------------------------------------------------------------ filters

export const REVIEWED_OPTIONS = ["me", "not-me", "none"] as const;
export type ReviewedFilter = (typeof REVIEWED_OPTIONS)[number];
export const SORT_OPTIONS = ["submitted", "name", "score"] as const;
export type SortKey = (typeof SORT_OPTIONS)[number];

export type Filters = {
  status: ApplicationStatus | "";
  role: string;
  year: string;
  reviewed: ReviewedFilter | "";
  q: string;
  sort: SortKey;
};

export const EMPTY_FILTERS: Filters = {
  status: "",
  role: "",
  year: "",
  reviewed: "",
  q: "",
  sort: "submitted",
};

type Params = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string {
  const v = Array.isArray(value) ? value[0] : value;
  return typeof v === "string" ? v : "";
}

/** URL search params → validated filters (anything unknown falls back to "all"). */
export function parseFilters(params: Params, roles: readonly Role[]): Filters {
  const status = first(params.status);
  const role = first(params.role);
  const year = first(params.year);
  const reviewed = first(params.reviewed);
  const sort = first(params.sort);
  return {
    status: (APPLICATION_STATUSES as readonly string[]).includes(status)
      ? (status as ApplicationStatus)
      : "",
    role: roles.some((r) => r.id === role) ? role : "",
    year: (YEARS as readonly string[]).includes(year) ? year : "",
    reviewed: (REVIEWED_OPTIONS as readonly string[]).includes(reviewed)
      ? (reviewed as ReviewedFilter)
      : "",
    q: first(params.q).trim().slice(0, 100),
    sort: (SORT_OPTIONS as readonly string[]).includes(sort) ? (sort as SortKey) : "submitted",
  };
}

/** The filters back into a query string (empty when nothing is set). */
export function filtersToParams(filters: Filters, overrides: Partial<Filters> = {}): string {
  const merged = { ...filters, ...overrides };
  const params = new URLSearchParams();
  if (merged.status) params.set("status", merged.status);
  if (merged.role) params.set("role", merged.role);
  if (merged.year) params.set("year", merged.year);
  if (merged.reviewed) params.set("reviewed", merged.reviewed);
  if (merged.q) params.set("q", merged.q);
  if (merged.sort !== "submitted") params.set("sort", merged.sort);
  const text = params.toString();
  return text ? `?${text}` : "";
}

function matchesQuery(row: ApplicationListRow, q: string): boolean {
  const needle = q.toLowerCase();
  const haystack = [
    row.name,
    row.email,
    row.application.purdue_email,
    row.application.major,
    row.application.year,
    ...row.roleNames,
  ];
  return haystack.some((value) => value?.toLowerCase().includes(needle));
}

export function applyFilters(
  rows: readonly ApplicationListRow[],
  filters: Filters,
  userId: string,
): ApplicationListRow[] {
  const filtered = rows.filter((row) => {
    if (filters.status && row.application.status !== filters.status) return false;
    if (filters.role && !row.application.roles_applied.includes(filters.role)) return false;
    if (filters.year && row.application.year !== filters.year) return false;
    if (filters.reviewed === "me" && !row.reviews.some((r) => r.reviewer_id === userId))
      return false;
    if (filters.reviewed === "not-me" && row.reviews.some((r) => r.reviewer_id === userId))
      return false;
    if (filters.reviewed === "none" && row.reviews.length > 0) return false;
    if (filters.q && !matchesQuery(row, filters.q)) return false;
    return true;
  });
  return sortRows(filtered, filters.sort);
}

/** Drafts always sink to the bottom; within a group the chosen key decides. */
export function sortRows(rows: readonly ApplicationListRow[], sort: SortKey): ApplicationListRow[] {
  const time = (value: string | null) => (value ? new Date(value).getTime() : 0);
  return [...rows].sort((a, b) => {
    const aDraft = a.application.status === "draft";
    const bDraft = b.application.status === "draft";
    if (aDraft !== bDraft) return aDraft ? 1 : -1;
    if (sort === "name") return a.name.localeCompare(b.name, "en");
    if (sort === "score") {
      const diff = (b.averageScore ?? -1) - (a.averageScore ?? -1);
      if (diff !== 0) return diff;
    }
    return (
      time(b.application.submitted_at ?? b.application.updated_at) -
      time(a.application.submitted_at ?? a.application.updated_at)
    );
  });
}

// ------------------------------------------------------------------------------ counts

export function countByStatus(
  rows: readonly ApplicationListRow[],
): Record<ApplicationStatus, number> {
  const counts = Object.fromEntries(APPLICATION_STATUSES.map((s) => [s, 0])) as Record<
    ApplicationStatus,
    number
  >;
  for (const row of rows) counts[row.application.status] += 1;
  return counts;
}

/** Submitted (non-draft) applications per role. An application counts once per role. */
export function countByRole(
  rows: readonly ApplicationListRow[],
  roles: readonly Role[],
): { role: Role; count: number }[] {
  return roles.map((role) => ({
    role,
    count: rows.filter(
      (row) =>
        row.application.status !== "draft" && row.application.roles_applied.includes(role.id),
    ).length,
  }));
}

// ------------------------------------------------------------------------------ csv

function csvCell(value: unknown): string {
  let text =
    value == null
      ? ""
      : Array.isArray(value)
        ? value.join("; ")
        : typeof value === "number"
          ? String(value)
          : String(value);
  // Spreadsheet formula injection: a leading =, +, -, @ would be evaluated by Excel.
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

/**
 * The applications as CSV (UTF-8 with BOM, CRLF), one column per question of the cycle,
 * review figures and every reviewer's notes. Rows come in filtered and sorted.
 */
export function buildCsv(
  rows: readonly ApplicationListRow[],
  roles: readonly Role[],
  questions: readonly Question[],
  answers: ReadonlyMap<string, Record<string, AnswerValue>>,
  reviewerNames: ReadonlyMap<string, Profile>,
): string {
  const roleName = new Map(roles.map((role) => [role.id, role.name]));
  const header = [
    "id",
    "name",
    "sign-in email",
    "purdue email",
    "year",
    "major",
    "linkedin",
    "portfolio",
    "roles",
    "status",
    "submitted at",
    "last saved",
    "reviews",
    "average score",
    "yes",
    "maybe",
    "no",
    "reviewer notes",
    ...questions.map((q) =>
      q.role_id ? `[${roleName.get(q.role_id) ?? "role"}] ${q.prompt}` : q.prompt,
    ),
  ];
  const lines = [header.map(csvCell).join(",")];
  for (const row of rows) {
    const a = row.application;
    const own = answers.get(a.id) ?? {};
    const decisions = { yes: 0, maybe: 0, no: 0 };
    for (const review of row.reviews) if (review.decision) decisions[review.decision] += 1;
    const notes = row.reviews
      .map((review) => {
        const who = reviewerNames.get(review.reviewer_id)?.email ?? review.reviewer_id;
        const head = [who, review.score != null ? `score ${review.score}` : null, review.decision]
          .filter(Boolean)
          .join(", ");
        return review.notes ? `${head}: ${review.notes}` : head;
      })
      .join("\n");
    lines.push(
      [
        a.id,
        row.name,
        row.email,
        a.purdue_email,
        a.year,
        a.major,
        a.linkedin_url,
        a.portfolio_url,
        row.roleNames,
        a.status,
        a.submitted_at,
        a.updated_at,
        row.reviewCount,
        row.averageScore == null ? "" : row.averageScore.toFixed(2),
        decisions.yes,
        decisions.maybe,
        decisions.no,
        notes,
        ...questions.map((q) => own[q.id] ?? ""),
      ]
        .map(csvCell)
        .join(","),
    );
  }
  return `\uFEFF${lines.join("\r\n")}\r\n`;
}
