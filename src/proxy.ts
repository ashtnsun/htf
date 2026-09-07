import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

/**
 * Application portal only: keep the Supabase session cookie fresh and bounce signed-out
 * visitors off the protected portal pages (src/lib/supabase/proxy.ts). The marketing pages
 * never run through here, so they stay static.
 */
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: ["/apply/:path*", "/admin/:path*"],
};
