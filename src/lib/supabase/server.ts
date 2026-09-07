import "server-only";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { Database } from "./database.types";
import { getSupabaseAuthEnv } from "./env";

export type PortalClient = SupabaseClient<Database>;

/**
 * Supabase client bound to the current request's cookies, for server components, server
 * actions and route handlers. Create one per request and never share it. Queries run as the
 * signed-in user (or anon), so Row Level Security applies.
 *
 * Cookie writes are refused while a server component renders (Next only allows them in
 * server actions and route handlers); that is fine because the proxy (src/proxy.ts)
 * refreshes the session before any portal page renders.
 */
export async function createClient(): Promise<PortalClient> {
  const env = getSupabaseAuthEnv();
  if (!env) {
    throw new Error("Supabase Auth is not configured (SUPABASE_URL and SUPABASE_ANON_KEY)");
  }
  const cookieStore = await cookies();
  return createServerClient<Database>(env.url, env.anonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called during a server component render: the proxy handles the refresh.
        }
      },
    },
  });
}
