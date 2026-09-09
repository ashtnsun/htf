"use client";

import { useActionState, useEffect, useRef, useState, type FormEvent } from "react";
import type { z } from "zod";
import {
  IDLE_STATE,
  emptyValues,
  firstFieldErrors,
  readValues,
  type FormState,
} from "@/lib/forms/fields";

export type FormMode = "server" | "mailto";

type MailtoState<Field extends string> =
  | { status: "idle" }
  | { status: "error"; message: string; fieldErrors: Partial<Record<Field, string>> }
  | { status: "opened"; name: string };

type Options<Field extends string, Data> = {
  /**
   * server = the server action stores / emails the submission (Supabase, Resend).
   * mailto = no delivery configured yet: submitting opens the visitor's email app with the
   * submission filled in, addressed to `email`.
   */
  mode: FormMode;
  email?: string | null;
  action: (previous: FormState<Field>, formData: FormData) => Promise<FormState<Field>>;
  fields: readonly Field[];
  /** The same Zod schema the server action uses; validates the mailto path on the client. */
  schema: z.ZodType<Data>;
  buildMailto: (to: string, data: Data) => string;
  /** The submitter's first-person name for the "Thanks, name." panel. */
  nameOf: (data: Data) => string;
};

const CHECK_MESSAGE = "Please check the highlighted fields.";

/**
 * Shared behaviour of the site's forms (contact, nonprofit intake). Progressive enhancement:
 * without JavaScript a form still posts to its server action and the page re-renders with
 * errors or the sent state. With JavaScript, useActionState gives inline errors and a
 * pending state without a navigation. In mailto mode the schema runs on the client and a
 * valid submit opens the visitor's email app instead.
 */
export function useFormSubmission<Field extends string, Data>({
  mode,
  email,
  action,
  fields,
  schema,
  buildMailto,
  nameOf,
}: Options<Field, Data>) {
  const [state, formAction, pending] = useActionState(action, IDLE_STATE as FormState<Field>);
  const [mailto, setMailto] = useState<MailtoState<Field>>({ status: "idle" });
  const formRef = useRef<HTMLFormElement>(null);

  const values =
    state.status === "error" && state.values ? state.values : emptyValues<Field>(fields);
  const fieldErrors: Partial<Record<Field, string>> =
    mode === "mailto"
      ? mailto.status === "error"
        ? mailto.fieldErrors
        : {}
      : state.status === "error"
        ? (state.fieldErrors ?? {})
        : {};
  const summary =
    mode === "mailto"
      ? mailto.status === "error"
        ? mailto.message
        : null
      : state.status === "error"
        ? state.message
        : null;

  // After a failed submit, put the keyboard on the first invalid control.
  useEffect(() => {
    if (!summary) return;
    const invalid = formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]');
    if (invalid?.tagName === "FIELDSET") {
      invalid.querySelector<HTMLElement>("input")?.focus();
    } else {
      invalid?.focus();
    }
  }, [summary, state, mailto]);

  const sent =
    mode === "server"
      ? state.status === "sent"
        ? { name: state.name, opened: false }
        : null
      : mailto.status === "opened"
        ? { name: mailto.name, opened: true }
        : null;

  function handleMailtoSubmit(event: FormEvent<HTMLFormElement>) {
    if (!email) return;
    event.preventDefault();
    const parsed = schema.safeParse(readValues(new FormData(event.currentTarget), fields));
    if (!parsed.success) {
      setMailto({
        status: "error",
        message: CHECK_MESSAGE,
        fieldErrors: firstFieldErrors<Field>(parsed.error),
      });
      return;
    }
    window.location.href = buildMailto(email, parsed.data);
    setMailto({ status: "opened", name: nameOf(parsed.data) });
  }

  const formProps =
    mode === "server"
      ? { action: formAction }
      : { action: `mailto:${email ?? ""}`, method: "get" as const, onSubmit: handleMailtoSubmit };

  return { formRef, formProps, pending, values, fieldErrors, summary, sent };
}
