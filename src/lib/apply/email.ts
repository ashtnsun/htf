import "server-only";
import { site } from "@content/site";
import { isEmailConfigured, sendEmail } from "@/lib/forms/deliver";
import { isTodo } from "@/lib/utils";

export type ConfirmationInput = {
  to: string;
  name: string | null;
  cycleName: string;
  roles: string[];
  /** Already formatted, e.g. "Sep 7, 1:02 AM". */
  submittedAt: string;
};

/** Plain text only; nothing from the application is interpreted as HTML. */
export function confirmationText(input: ConfirmationInput): string {
  const firstName = input.name?.trim().split(/\s+/)[0];
  const greeting = firstName ? `Hi ${firstName},` : "Hi there,";
  const roles = input.roles.length > 0 ? input.roles.join(", ") : "(no role recorded)";
  const contact = isTodo(site.socials.email)
    ? `Questions? Use the contact page: ${site.url}/contact`
    : `Questions? Reply to this email or write to ${site.socials.email}.`;
  return [
    greeting,
    "",
    `We received your application to ${site.name} for ${input.cycleName} on ${input.submittedAt}.`,
    `Roles: ${roles}`,
    "",
    "We read every application after the deadline and follow up by email at this address.",
    `Until then you can look at what you sent at ${site.url}/apply.`,
    "",
    contact,
    "",
    site.legalName,
    site.socials.instagram,
  ].join("\n");
}

/**
 * Confirmation email after a submission, through Resend (RESEND_API_KEY + CONTACT_FROM, see
 * .env.example). Returns whether it was sent; a missing key or a failed request is logged
 * and never blocks the submission, which is already stored.
 */
export async function sendApplicationConfirmation(input: ConfirmationInput): Promise<boolean> {
  if (!isEmailConfigured()) {
    console.warn("[apply] confirmation email skipped: RESEND_API_KEY is not set");
    return false;
  }
  try {
    await sendEmail({
      to: input.to,
      subject: `We received your ${input.cycleName} application to ${site.name}`,
      text: confirmationText(input),
      replyTo: isTodo(site.socials.email) ? undefined : site.socials.email,
    });
    return true;
  } catch (error) {
    console.error(
      "[apply] confirmation email failed:",
      error instanceof Error ? error.message : error,
    );
    return false;
  }
}
