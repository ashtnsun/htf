import { z } from "zod";

/**
 * Nonprofit intake form contract (the "Start a project" form on /nonprofits), shared by the
 * client form (native validation attributes, mailto fallback) and the server action
 * (authoritative Zod validation). No server imports here.
 */

export const ORGANIZATION_MAX = 120;
export const NAME_MAX = 80;
export const EMAIL_MAX = 254;
export const WEBSITE_MAX = 200;
export const LOCATION_MAX = 120;
export const MESSAGE_MIN = 20;
export const MESSAGE_MAX = 3000;

/** "example.org" becomes "https://example.org"; anything that is not a web URL is rejected. */
function isWebUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (url.protocol === "https:" || url.protocol === "http:") && url.hostname.includes(".");
  } catch {
    return false;
  }
}

export const inquirySchema = z.object({
  organization: z
    .string()
    .trim()
    .min(1, "Tell us the name of your organization.")
    .max(ORGANIZATION_MAX, `Keep the organization name under ${ORGANIZATION_MAX} characters.`),
  name: z
    .string()
    .trim()
    .min(1, "Tell us your name.")
    .max(NAME_MAX, `Keep your name under ${NAME_MAX} characters.`),
  email: z
    .email("Enter a valid email address so we can reply.")
    .max(EMAIL_MAX, "That email address is too long."),
  website: z
    .string()
    .trim()
    .max(WEBSITE_MAX, "That web address is too long.")
    .transform((value) => (value && !/^https?:\/\//i.test(value) ? `https://${value}` : value))
    .refine((value) => value === "" || isWebUrl(value), "Enter a web address such as example.org."),
  location: z
    .string()
    .trim()
    .max(LOCATION_MAX, `Keep the location under ${LOCATION_MAX} characters.`),
  message: z
    .string()
    .trim()
    .min(MESSAGE_MIN, `Tell us a little more (at least ${MESSAGE_MIN} characters).`)
    .max(MESSAGE_MAX, `Keep it under ${MESSAGE_MAX.toLocaleString("en-US")} characters.`),
});

export type Inquiry = z.infer<typeof inquirySchema>;
export type InquiryField = keyof Inquiry;

/** Field order of the form; also the keys read out of FormData. */
export const INQUIRY_FIELDS = [
  "organization",
  "name",
  "email",
  "website",
  "location",
  "message",
] as const satisfies InquiryField[];

/** Plain-text body shared by the notification email and the mailto fallback. */
export function inquiryText(inquiry: Inquiry): string[] {
  return [
    `Organization: ${inquiry.organization}`,
    `Contact: ${inquiry.name}`,
    `Email: ${inquiry.email}`,
    `Website: ${inquiry.website || "(not given)"}`,
    `Location: ${inquiry.location || "(not given)"}`,
    "",
    inquiry.message,
  ];
}

/** mailto: URL with the inquiry pre-filled, for the fallback before delivery is configured. */
export function buildInquiryMailto(to: string, inquiry: Inquiry): string {
  const subject = `Project inquiry from ${inquiry.organization}`;
  const body = inquiryText(inquiry).join("\r\n");
  return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
