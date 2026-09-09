import { z } from "zod";

/**
 * Sign-in contract for the application portal, shared by the client form (native hints)
 * and the server actions (authoritative validation). No server imports here.
 */

export const EMAIL_MAX = 254;
export const CODE_LENGTH = 6;

const emailSchema = z
  .email("Enter the email address you want to sign in with.")
  .max(EMAIL_MAX, "That email address is too long.")
  .transform((value) => value.trim().toLowerCase());

export const signInEmailSchema = z.object({ email: emailSchema });

export const signInCodeSchema = z.object({
  email: emailSchema,
  code: z
    .string()
    .transform((value) => value.replace(/\s+/g, ""))
    .pipe(z.string().regex(/^\d{6}$/, "Enter the six-digit code from the email.")),
});

export type SignInField = "email" | "code";

/** Keys read out of FormData for each step. */
export const SIGN_IN_FIELDS = ["email"] as const satisfies SignInField[];
export const CODE_FIELDS = ["email", "code"] as const satisfies SignInField[];

export const DEFAULT_NEXT = "/apply";

/**
 * Where to go after signing in. Only portal paths are allowed (never an external URL or a
 * protocol-relative one), so a crafted link cannot bounce people elsewhere.
 */
export function safeNextPath(value: unknown, fallback: string = DEFAULT_NEXT): string {
  if (typeof value !== "string") return fallback;
  return /^\/(apply|admin)(\/[A-Za-z0-9._~-]+)*\/?$/.test(value) ? value : fallback;
}
