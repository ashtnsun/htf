import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { isPortalConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export type SessionUser = { id: string; email: string };

/**
 * The signed-in account for this request, or null. Verified against the JWT (not just read
 * from the cookie) and cached for the request, so layouts, pages and actions can all ask.
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  if (!isPortalConfigured()) return null;
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims || typeof claims.sub !== "string") return null;
  return { id: claims.sub, email: typeof claims.email === "string" ? claims.email : "" };
});

/** True when the account's email is in public.admins. Decided in the database (is_admin()). */
export const isAdminUser = cache(async (): Promise<boolean> => {
  const user = await getSessionUser();
  if (!user) return false;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("is_admin");
  if (error) {
    console.error("[auth] is_admin() failed:", error.message);
    return false;
  }
  return data === true;
});

/** For protected pages: sends signed-out visitors to the landing with a `next` back here. */
export async function requireUser(next: string): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect(`/apply?next=${encodeURIComponent(next)}`);
  return user;
}
