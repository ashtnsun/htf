"use server";

import { firstFieldErrors, isHoneypotFilled, readValues, type FormState } from "@/lib/forms/fields";
import { deliverInquiry, isIntakeFormConfigured } from "@/lib/inquiries/deliver";
import { INQUIRY_FIELDS, inquirySchema, type InquiryField } from "@/lib/inquiries/schema";

export type IntakeFormState = FormState<InquiryField>;

/**
 * Server action behind <IntakeForm> on /nonprofits. Zod is the boundary; the inquiry goes to
 * the configured delivery (Supabase table `nonprofit_inquiries` and/or the club inbox).
 * Returns UI state only: never the raw error or the stored record.
 */
export async function submitInquiry(
  _previous: IntakeFormState,
  formData: FormData,
): Promise<IntakeFormState> {
  const values = readValues(formData, INQUIRY_FIELDS);

  if (isHoneypotFilled(formData)) {
    return { status: "sent", name: values.name || "there" };
  }

  const parsed = inquirySchema.safeParse(values);
  if (!parsed.success) {
    return {
      status: "error",
      message: "Please check the highlighted fields.",
      fieldErrors: firstFieldErrors<InquiryField>(parsed.error),
      values,
    };
  }

  if (!isIntakeFormConfigured()) {
    return {
      status: "error",
      message: "The form is not connected yet. Please email or message us directly.",
      values,
    };
  }

  try {
    await deliverInquiry(parsed.data);
  } catch (error) {
    console.error("[intake] delivery failed:", error instanceof Error ? error.message : error);
    return {
      status: "error",
      message:
        "Something went wrong while sending your inquiry. Please try again in a minute, or email us directly.",
      values,
    };
  }

  return { status: "sent", name: parsed.data.name };
}
