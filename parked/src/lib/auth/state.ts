import type { SignInField } from "./schema";

/**
 * State of the two-step sign-in (email, then the six-digit code), returned by the server
 * actions in src/app/apply/actions.ts and rendered by <SignInForm>. Kept apart from the
 * actions file because a "use server" module may only export async functions.
 */
export type SignInState =
  | { status: "idle" }
  | { status: "sent"; email: string; next: string; resent: boolean; at: number }
  | {
      status: "error";
      /** When the action ran (ms). The form shows whichever of its two states is newer. */
      at: number;
      /** Which step the message belongs to, so a failed resend stays on the code step. */
      step: "email" | "code";
      message: string;
      fieldErrors?: Partial<Record<SignInField, string>>;
      email: string;
      next: string;
    };

export const SIGN_IN_IDLE: SignInState = { status: "idle" };
