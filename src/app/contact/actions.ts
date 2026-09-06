"use server";

import { deliverContactMessage, isContactFormConfigured } from "@/lib/contact/deliver";
import {
  contactMessageSchema,
  firstFieldErrors,
  readContactValues,
  type ContactField,
  type ContactValues,
} from "@/lib/contact/schema";

export type ContactFormState =
  | { status: "idle" }
  | { status: "sent"; name: string }
  | {
      status: "error";
      message: string;
      fieldErrors?: Partial<Record<ContactField, string>>;
      /** Echoed back so the form keeps what was typed (React resets forms after an action). */
      values?: ContactValues;
    };

/** Bots that fill every input also fill this hidden one; humans never see it. */
const HONEYPOT_FIELD = "fax";

/**
 * Server action behind <ContactForm>. Validates with Zod (the browser's `required` and
 * `type="email"` are a convenience, not a boundary), then hands the message to the
 * configured delivery. Returns UI state only: never the raw error or the stored record.
 */
export async function submitContactMessage(
  _previous: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  const values = readContactValues(formData);

  if (String(formData.get(HONEYPOT_FIELD) ?? "") !== "") {
    // Quietly accept so the bot learns nothing.
    return { status: "sent", name: values.name || "there" };
  }

  const parsed = contactMessageSchema.safeParse(values);
  if (!parsed.success) {
    return {
      status: "error",
      message: "Please check the highlighted fields.",
      fieldErrors: firstFieldErrors(parsed.error),
      values,
    };
  }

  if (!isContactFormConfigured()) {
    return {
      status: "error",
      message: "The contact form is not connected yet. Please email or message us directly.",
      values,
    };
  }

  try {
    await deliverContactMessage(parsed.data);
  } catch (error) {
    console.error("[contact] delivery failed:", error instanceof Error ? error.message : error);
    return {
      status: "error",
      message:
        "Something went wrong while sending your message. Please try again in a minute, or email us directly.",
      values,
    };
  }

  return { status: "sent", name: parsed.data.name };
}
