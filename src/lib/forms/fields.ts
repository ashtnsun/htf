import type { z } from "zod";

/**
 * Helpers shared by the site's forms (contact, nonprofit intake) on both sides of the wire:
 * the result shape of a form server action, reading raw values out of FormData, and the
 * first Zod message per field for inline errors. No server imports here.
 */

export type FormState<Field extends string> =
  | { status: "idle" }
  | { status: "sent"; name: string }
  | {
      status: "error";
      message: string;
      fieldErrors?: Partial<Record<Field, string>>;
      /** Echoed back so the form keeps what was typed (React resets forms after an action). */
      values?: Record<Field, string>;
    };

export const IDLE_STATE = { status: "idle" } as const;

/** Bots that fill every input also fill this hidden one; humans never see it. */
export const HONEYPOT_FIELD = "fax";

export function isHoneypotFilled(formData: FormData): boolean {
  return String(formData.get(HONEYPOT_FIELD) ?? "") !== "";
}

/** Raw strings from a submitted form for the given fields. Missing fields become "". */
export function readValues<Field extends string>(
  formData: FormData,
  fields: readonly Field[],
): Record<Field, string> {
  const values = {} as Record<Field, string>;
  for (const field of fields) {
    const value = formData.get(field);
    values[field] = typeof value === "string" ? value : "";
  }
  return values;
}

export function emptyValues<Field extends string>(fields: readonly Field[]): Record<Field, string> {
  const values = {} as Record<Field, string>;
  for (const field of fields) values[field] = "";
  return values;
}

/** First Zod message per field, for inline errors (server action and mailto fallback). */
export function firstFieldErrors<Field extends string>(
  error: z.ZodError,
): Partial<Record<Field, string>> {
  const first: Partial<Record<Field, string>> = {};
  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field !== "string") continue;
    if (!(field in first)) first[field as Field] = issue.message;
  }
  return first;
}
