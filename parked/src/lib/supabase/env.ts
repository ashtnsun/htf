/**
 * Supabase Auth configuration for the application portal (PLAN.md section 5).
 *
 *   SUPABASE_URL       shared with the form delivery (src/lib/forms/deliver.ts)
 *   SUPABASE_ANON_KEY  the anon / publishable key; safe to expose, but it stays server-side
 *                      because every portal call runs in a server action, a server component
 *                      or the proxy. Row Level Security does the real access control.
 *
 * No `server-only` import here: src/proxy.ts uses it too.
 */

export type SupabaseAuthEnv = { url: string; anonKey: string };

function read(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

export function getSupabaseAuthEnv(): SupabaseAuthEnv | null {
  const url = read("SUPABASE_URL");
  const anonKey = read("SUPABASE_ANON_KEY");
  return url && anonKey ? { url: url.replace(/\/+$/, ""), anonKey } : null;
}

/** True when the portal can sign people in (both variables set). */
export function isPortalConfigured(): boolean {
  return getSupabaseAuthEnv() !== null;
}
