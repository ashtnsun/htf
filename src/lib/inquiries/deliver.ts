import "server-only";
import { deliverSubmission, isFormDeliveryConfigured } from "@/lib/forms/deliver";
import { inquiryText, type Inquiry } from "./schema";

/** Inquiries go to public.nonprofit_inquiries and/or the club inbox (see lib/forms/deliver). */
export const isIntakeFormConfigured = isFormDeliveryConfigured;

export function deliverInquiry(inquiry: Inquiry): Promise<void> {
  return deliverSubmission({
    table: "nonprofit_inquiries",
    record: {
      organization: inquiry.organization,
      name: inquiry.name,
      email: inquiry.email,
      website: inquiry.website || null,
      location: inquiry.location || null,
      message: inquiry.message,
    },
    email: {
      subject: `[HTF website] Project inquiry from ${inquiry.organization}`,
      text: inquiryText(inquiry).join("\n"),
      replyTo: inquiry.email,
    },
  });
}
