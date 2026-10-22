import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Goal, Portfolio, PortfolioKind } from "./shared";

/**
 * Portfolio Night storage. Every query runs here with the service role, after the server
 * action has checked who is asking (the host cookie, or the note's owner token). The browser
 * never writes to Supabase; it only reads goals through Realtime with the anon key.
 *
 *   SUPABASE_URL               the project URL
 *   SUPABASE_ANON_KEY          public; handed to the goals board for Realtime
 *   SUPABASE_SERVICE_ROLE_KEY  server only, never with a NEXT_PUBLIC_ prefix
 */

const BUCKET = "portfolio-shots";

function read(name: string): string | undefined {
  return process.env[name]?.trim() || undefined;
}

export function getPortfolioEnv() {
  const url = read("SUPABASE_URL")?.replace(/\/+$/, "");
  const anonKey = read("SUPABASE_ANON_KEY");
  const serviceKey = read("SUPABASE_SERVICE_ROLE_KEY");
  return url && anonKey && serviceKey ? { url, anonKey, serviceKey } : null;
}

let client: SupabaseClient | null = null;

function db(): SupabaseClient {
  const env = getPortfolioEnv();
  if (!env)
    throw new Error(
      "Portfolio Night needs SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY",
    );
  client ??= createClient(env.url, env.serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}

function fail(what: string, error: { message: string }): never {
  throw new Error(`[portfolio] ${what}: ${error.message}`);
}

const PORTFOLIO_COLUMNS = "id, kind, url, title, screenshot_url, created_at";
const GOAL_COLUMNS = "id, x, y, color, text, updated_at";

/** Reference in the order the host added them; community newest first. */
export async function listPortfolios(kind: PortfolioKind): Promise<Portfolio[]> {
  const { data, error } = await db()
    .from("portfolios")
    .select(PORTFOLIO_COLUMNS)
    .eq("kind", kind)
    .order("created_at", { ascending: kind === "reference" });
  if (error) fail("list portfolios", error);
  return data as Portfolio[];
}

export async function portfolioExists(kind: PortfolioKind, url: string): Promise<boolean> {
  const { count, error } = await db()
    .from("portfolios")
    .select("id", { count: "exact", head: true })
    .eq("kind", kind)
    .eq("url", url);
  if (error) fail("check portfolio", error);
  return (count ?? 0) > 0;
}

export async function insertPortfolio(row: Omit<Portfolio, "created_at">): Promise<void> {
  const { error } = await db().from("portfolios").insert(row);
  if (error) fail("insert portfolio", error);
}

export async function getPortfolio(id: string): Promise<Portfolio | null> {
  const { data, error } = await db()
    .from("portfolios")
    .select(PORTFOLIO_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (error) fail("get portfolio", error);
  return data as Portfolio | null;
}

export async function setScreenshot(id: string, screenshotUrl: string): Promise<void> {
  const { error } = await db()
    .from("portfolios")
    .update({ screenshot_url: screenshotUrl })
    .eq("id", id);
  if (error) fail("set screenshot", error);
}

export async function deletePortfolio(id: string): Promise<void> {
  const { error } = await db().from("portfolios").delete().eq("id", id);
  if (error) fail("delete portfolio", error);
  await db()
    .storage.from(BUCKET)
    .remove([`${id}.jpg`]);
}

/** Stores the capture under the portfolio's id; the query string busts caches on a recapture. */
export async function uploadScreenshot(id: string, jpeg: ArrayBuffer): Promise<string> {
  const path = `${id}.jpg`;
  const bucket = db().storage.from(BUCKET);
  const { error } = await bucket.upload(path, jpeg, { contentType: "image/jpeg", upsert: true });
  if (error) fail("upload screenshot", error);
  return `${bucket.getPublicUrl(path).data.publicUrl}?v=${Date.now()}`;
}

/** Oldest first, so the newest note (and the one last touched) paints on top. */
export async function listGoals(ownerHash: string | null): Promise<(Goal & { mine: boolean })[]> {
  const { data, error } = await db()
    .from("goals")
    .select(`${GOAL_COLUMNS}, owner_hash`)
    .order("updated_at", { ascending: true });
  if (error) fail("list goals", error);
  return (data as (Goal & { owner_hash: string })[]).map(({ owner_hash, ...goal }) => ({
    ...goal,
    mine: ownerHash !== null && owner_hash === ownerHash,
  }));
}

export async function insertGoal(
  row: Pick<Goal, "x" | "y" | "color" | "text"> & { owner_hash: string },
): Promise<Goal> {
  const { data, error } = await db().from("goals").insert(row).select(GOAL_COLUMNS).single();
  if (error) fail("insert goal", error);
  return data as Goal;
}

/**
 * Updates or deletes a note only where `owner_hash` matches, unless the host is asking
 * (ownerHash null). Returns false when nothing matched: someone else's note, or gone.
 */
export async function updateGoal(
  id: string,
  ownerHash: string | null,
  patch: Partial<Pick<Goal, "x" | "y" | "color" | "text">>,
): Promise<boolean> {
  let query = db()
    .from("goals")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (ownerHash !== null) query = query.eq("owner_hash", ownerHash);
  const { data, error } = await query.select("id");
  if (error) fail("update goal", error);
  return data.length > 0;
}

export async function deleteGoal(id: string, ownerHash: string | null): Promise<boolean> {
  let query = db().from("goals").delete().eq("id", id);
  if (ownerHash !== null) query = query.eq("owner_hash", ownerHash);
  const { data, error } = await query.select("id");
  if (error) fail("delete goal", error);
  return data.length > 0;
}
