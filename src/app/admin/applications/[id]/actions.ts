"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getSessionUser, isAdminUser, type SessionUser } from "@/lib/auth/session";
import { ADMIN_STATUSES, REVIEW_DECISIONS } from "@/lib/portal/admin";
import type { ApplicationStatus } from "@/lib/portal/data";
import { createClient, type PortalClient } from "@/lib/supabase/server";

/**
 * Exec actions on one application: save (upsert) or remove the signed-in member's review,
 * and move the application's status. Every write runs as that member, so the policies and
 * the guard trigger enforce "own review row", "not a draft" and "status only". Results come
 * back as a flash in the query string, so the forms work without JavaScript.
 */

const NOTES_MAX = 5000;

const idSchema = z.uuid();

const reviewSchema = z.object({
  score: z
    .string()
    .trim()
    .refine((value) => value === "" || /^[1-5]$/.test(value), {
      error: "Pick a score from 1 to 5.",
    })
    .transform((value) => (value === "" ? null : Number(value))),
  decision: z
    .string()
    .trim()
    .refine((value) => value === "" || (REVIEW_DECISIONS as readonly string[]).includes(value), {
      error: "Pick yes, maybe or no.",
    })
    .transform((value) => (value === "" ? null : (value as (typeof REVIEW_DECISIONS)[number]))),
  notes: z
    .string()
    .transform((value) => value.replace(/\r\n?/g, "\n").trim())
    .pipe(z.string().max(NOTES_MAX, "Keep the notes under 5,000 characters."))
    .transform((value) => (value === "" ? null : value)),
});

const statusSchema = z
  .string()
  .refine((value) => (ADMIN_STATUSES as readonly string[]).includes(value), {
    error: "Unknown status.",
  })
  .transform((value) => value as ApplicationStatus);

async function gate(): Promise<{ user: SessionUser; supabase: PortalClient }> {
  const user = await getSessionUser();
  if (!user) redirect("/apply?next=%2Fadmin");
  if (!(await isAdminUser())) redirect("/admin");
  return { user, supabase: await createClient() };
}

function applicationId(formData: FormData): string {
  const parsed = idSchema.safeParse(formData.get("application"));
  if (!parsed.success) redirect("/admin");
  return parsed.data;
}

function back(id: string, flash: Record<string, string>): never {
  const params = new URLSearchParams(flash).toString();
  redirect(`/admin/applications/${id}${params ? `?${params}` : ""}#review`);
}

function refresh(id: string) {
  revalidatePath(`/admin/applications/${id}`);
  revalidatePath("/admin");
}

export async function saveReview(formData: FormData): Promise<void> {
  const { user, supabase } = await gate();
  const id = applicationId(formData);
  const parsed = reviewSchema.safeParse({
    score: formData.get("score") ?? "",
    decision: formData.get("decision") ?? "",
    notes: formData.get("notes") ?? "",
  });
  if (!parsed.success) back(id, { review: "invalid" });
  const { error } = await supabase.from("reviews").upsert(
    {
      application_id: id,
      reviewer_id: user.id,
      score: parsed.data.score,
      decision: parsed.data.decision,
      notes: parsed.data.notes,
    },
    { onConflict: "application_id,reviewer_id" },
  );
  if (error) {
    console.error("[admin] review save failed:", error.code, error.message);
    back(id, { review: "failed" });
  }
  refresh(id);
  back(id, { review: "saved" });
}

export async function removeReview(formData: FormData): Promise<void> {
  const { user, supabase } = await gate();
  const id = applicationId(formData);
  const { error } = await supabase
    .from("reviews")
    .delete()
    .eq("application_id", id)
    .eq("reviewer_id", user.id);
  if (error) {
    console.error("[admin] review delete failed:", error.code, error.message);
    back(id, { review: "failed" });
  }
  refresh(id);
  back(id, { review: "removed" });
}

export async function setApplicationStatus(formData: FormData): Promise<void> {
  const { supabase } = await gate();
  const id = applicationId(formData);
  const parsed = statusSchema.safeParse(formData.get("status"));
  if (!parsed.success) back(id, { status: "invalid" });
  const { data, error } = await supabase
    .from("applications")
    .update({ status: parsed.data })
    .eq("id", id)
    .select("id");
  if (error) {
    console.error("[admin] status update failed:", error.code, error.message);
    back(id, { status: "failed" });
  }
  // Zero rows means the policies or the guard trigger refused it (a draft, say).
  if (data.length === 0) back(id, { status: "refused" });
  refresh(id);
  back(id, { status: "saved" });
}
