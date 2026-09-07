import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { DEFAULT_NEXT, safeNextPath } from "@/lib/auth/schema";
import { isPortalConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

/** The email types Supabase issues for an email sign-in (supabase/templates/sign-in.html). */
const LINK_TYPES = new Set(["email", "magiclink", "signup"]);

/**
 * Target of the link in the sign-in email:
 * /auth/confirm?token_hash=…&type=email[&next=/apply/…]. Verifying the token hash sets the
 * session cookies (works on any device, unlike a PKCE code exchange), then we continue to the
 * portal. An expired or used link goes back to the landing with a message.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = safeNextPath(searchParams.get("next"));

  if (tokenHash && type && LINK_TYPES.has(type) && isPortalConfigured()) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      type: type as "email" | "magiclink" | "signup",
      token_hash: tokenHash,
    });
    if (!error) redirect(next);
    console.error("[auth] link verification failed:", error.code ?? error.status, error.message);
  }

  redirect(`${DEFAULT_NEXT}?error=link`);
}
