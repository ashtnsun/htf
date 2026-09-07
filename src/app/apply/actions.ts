"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { site } from "@content/site";
import {
  CODE_FIELDS,
  SIGN_IN_FIELDS,
  safeNextPath,
  signInCodeSchema,
  signInEmailSchema,
  type SignInField,
} from "@/lib/auth/schema";
import type { SignInState } from "@/lib/auth/state";
import { firstFieldErrors, isHoneypotFilled, readValues } from "@/lib/forms/fields";
import { isPortalConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

const CHECK_MESSAGE = "Please check the highlighted field.";
const NOT_CONNECTED =
  "Sign-in is not connected yet. Please use the application form link from our Instagram for now.";

/**
 * Origin for the link in the sign-in email, taken from the request so a preview deployment
 * links to itself. Supabase only honours it when it matches the project's redirect allow list
 * (docs/DEPLOY.md section 6) and falls back to the Site URL otherwise, so a spoofed header
 * cannot point the link anywhere else.
 */
async function requestOrigin(): Promise<string> {
  const h = await headers();
  const origin = h.get("origin");
  if (origin && /^https?:\/\/[^/]+$/.test(origin)) return origin;
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (!host) return site.url;
  const proto =
    h.get("x-forwarded-proto") ??
    (/^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host) ? "http" : "https");
  return `${proto}://${host}`;
}

function sendFailureMessage(code: string | undefined, status: number | undefined): string {
  if (
    code === "over_email_send_rate_limit" ||
    code === "over_request_rate_limit" ||
    status === 429
  ) {
    return "We sent a code to that address a moment ago. Give it a minute, then try again.";
  }
  if (code === "email_address_invalid" || code === "validation_failed") {
    return "That email address doesn't look right. Check it and try again.";
  }
  return "We couldn't send the code just now. Please try again in a minute.";
}

// Supabase reports a mistyped code and a stale one with the same code (otp_expired), so one
// message covers both.
function verifyFailureMessage(code: string | undefined, status: number | undefined): string {
  if (code === "over_request_rate_limit" || status === 429) {
    return "Too many attempts. Wait a minute, then send a new code.";
  }
  return "That code didn't match, or it has expired. Check the six digits and try again, or send a new code.";
}

/**
 * Step 1: email in, code out. Supabase creates the account on first sign-in and emails a
 * six-digit code plus a link to /auth/confirm (supabase/templates/sign-in.html). Returns UI
 * state only; the same shape is returned for the resend button on the code step.
 */
export async function requestSignInCode(
  _previous: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const values = readValues(formData, SIGN_IN_FIELDS);
  const next = safeNextPath(formData.get("next"));
  const resent = formData.get("resend") === "1";
  const step = resent ? "code" : "email";

  if (isHoneypotFilled(formData)) {
    // Quietly pretend so the bot learns nothing.
    return { status: "sent", email: values.email, next, resent, at: Date.now() };
  }

  const parsed = signInEmailSchema.safeParse(values);
  if (!parsed.success) {
    return {
      status: "error",
      at: Date.now(),
      step,
      message: CHECK_MESSAGE,
      fieldErrors: firstFieldErrors<SignInField>(parsed.error),
      email: values.email,
      next,
    };
  }
  if (!isPortalConfigured()) {
    return {
      status: "error",
      at: Date.now(),
      step,
      message: NOT_CONNECTED,
      email: parsed.data.email,
      next,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: { emailRedirectTo: `${await requestOrigin()}/auth/confirm`, shouldCreateUser: true },
  });
  if (error) {
    console.error("[auth] signInWithOtp failed:", error.code ?? error.status, error.message);
    return {
      status: "error",
      at: Date.now(),
      step,
      message: sendFailureMessage(error.code, error.status),
      email: parsed.data.email,
      next,
    };
  }
  return { status: "sent", email: parsed.data.email, next, resent, at: Date.now() };
}

/** Step 2: the six-digit code. On success the session cookie is set and we go to `next`. */
export async function verifySignInCode(
  _previous: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const values = readValues(formData, CODE_FIELDS);
  const next = safeNextPath(formData.get("next"));

  const parsed = signInCodeSchema.safeParse(values);
  if (!parsed.success) {
    return {
      status: "error",
      at: Date.now(),
      step: "code",
      message: CHECK_MESSAGE,
      fieldErrors: firstFieldErrors<SignInField>(parsed.error),
      email: values.email,
      next,
    };
  }
  if (!isPortalConfigured()) {
    return {
      status: "error",
      at: Date.now(),
      step: "code",
      message: NOT_CONNECTED,
      email: parsed.data.email,
      next,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    email: parsed.data.email,
    token: parsed.data.code,
    type: "email",
  });
  if (error) {
    console.error("[auth] verifyOtp failed:", error.code ?? error.status, error.message);
    return {
      status: "error",
      at: Date.now(),
      step: "code",
      message: verifyFailureMessage(error.code, error.status),
      email: parsed.data.email,
      next,
    };
  }
  redirect(next);
}

/** Ends the session (clears the cookies) and returns to the landing. */
export async function signOut(): Promise<void> {
  if (isPortalConfigured()) {
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut();
    if (error) console.error("[auth] signOut failed:", error.code ?? error.status, error.message);
  }
  redirect("/apply");
}
