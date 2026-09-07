import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAuthEnv } from "./env";

/**
 * Portal paths that need a session. This is the optimistic check; every page and server
 * action verifies again with src/lib/auth/session.ts, and Row Level Security guards the data.
 */
const PROTECTED = [/^\/apply\/(form|submitted)(\/|$)/, /^\/admin(\/|$)/];

export function isProtectedPath(pathname: string): boolean {
  return PROTECTED.some((pattern) => pattern.test(pathname));
}

/**
 * Runs for /apply and /admin requests (src/proxy.ts). Refreshes an expired Supabase session
 * so the new cookies reach both the page render and the browser, and sends signed-out
 * visitors of protected pages to the landing with a `next` back to where they were.
 * Without the Supabase variables it does nothing, so the rest of the site is untouched.
 */
export async function updateSession(request: NextRequest): Promise<NextResponse> {
  const env = getSupabaseAuthEnv();
  if (!env) return NextResponse.next({ request });

  let response = NextResponse.next({ request });
  const supabase = createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // Validates the session (refreshing it through setAll when the access token has expired).
  const { data } = await supabase.auth.getClaims();
  const signedIn = typeof data?.claims.sub === "string";

  if (!signedIn && isProtectedPath(request.nextUrl.pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/apply";
    url.search = `?next=${encodeURIComponent(request.nextUrl.pathname)}`;
    const redirect = NextResponse.redirect(url);
    for (const cookie of response.cookies.getAll()) redirect.cookies.set(cookie);
    return redirect;
  }

  return response;
}
