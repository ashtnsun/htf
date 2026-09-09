import "server-only";
import { deliverSubmission, isFormDeliveryConfigured } from "@/lib/forms/deliver";
import { audienceLabel, contactMessageText, type ContactMessage } from "./schema";

/** Contact messages go to public.contact_messages and/or the club inbox (see lib/forms/deliver). */
export const isContactFormConfigured = isFormDeliveryConfigured;

export function deliverContactMessage(message: ContactMessage): Promise<void> {
  return deliverSubmission({
    table: "contact_messages",
    record: message,
    email: {
      subject: `[HTF website] ${message.name} (${audienceLabel(message.audience).toLowerCase()})`,
      text: contactMessageText(message).join("\n"),
      replyTo: message.email,
    },
  });
}
