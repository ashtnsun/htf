"use server";

import { deliverContactMessage, isContactFormConfigured } from "@/lib/contact/deliver";
import { CONTACT_FIELDS, contactMessageSchema, type ContactField } from "@/lib/contact/schema";
import { firstFieldErrors, isHoneypotFilled, readValues, type FormState } from "@/lib/forms/fields";

export type ContactFormState = FormState<ContactField>;

/**
 * Server action behind <ContactForm>. Validates with Zod (the browser's `required` and
 * `type="email"` are a convenience, not a boundary), then hands the message to the
 * configured delivery. Returns UI state only: never the raw error or the stored record.
 */
export async function submitContactMessage(
  _previous: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  const values = readValues(formData, CONTACT_FIELDS);

  if (isHoneypotFilled(formData)) {
    // Quietly accept so the bot learns nothing.
    return { status: "sent", name: values.name || "there" };
  }

  const parsed = contactMessageSchema.safeParse(values);
  if (!parsed.success) {
    return {
      status: "error",
      message: "Please check the highlighted fields.",
      fieldErrors: firstFieldErrors<ContactField>(parsed.error),
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
