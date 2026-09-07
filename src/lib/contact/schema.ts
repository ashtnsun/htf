import { z } from "zod";

/**
 * Contact form contract, shared by the client form (native validation attributes, mailto
 * fallback) and the server action (authoritative Zod validation). No server imports here.
 */

export const AUDIENCES = [
  { value: "student", label: "A student" },
  { value: "nonprofit", label: "A nonprofit" },
  { value: "other", label: "Someone else" },
] as const;

export type Audience = (typeof AUDIENCES)[number]["value"];

export const NAME_MAX = 80;
export const EMAIL_MAX = 254;
export const MESSAGE_MIN = 10;
export const MESSAGE_MAX = 2000;

export const audienceSchema = z.enum(["student", "nonprofit", "other"], {
  error: "Pick the option that fits you best.",
});

export const contactMessageSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Tell us your name.")
    .max(NAME_MAX, `Keep your name under ${NAME_MAX} characters.`),
  email: z
    .email("Enter a valid email address so we can reply.")
    .max(EMAIL_MAX, "That email address is too long."),
  audience: audienceSchema,
  message: z
    .string()
    .trim()
    .min(MESSAGE_MIN, `Add a few more words (at least ${MESSAGE_MIN} characters).`)
    .max(MESSAGE_MAX, `Keep your message under ${MESSAGE_MAX.toLocaleString("en-US")} characters.`),
});

export type ContactMessage = z.infer<typeof contactMessageSchema>;
export type ContactField = keyof ContactMessage;

/** Field order of the form; also the keys read out of FormData. */
export const CONTACT_FIELDS = [
  "name",
  "email",
  "audience",
  "message",
] as const satisfies ContactField[];

export function audienceLabel(value: Audience): string {
  return AUDIENCES.find((a) => a.value === value)?.label ?? value;
}

/** Plain-text body shared by the notification email and the mailto fallback. */
export function contactMessageText(message: ContactMessage): string[] {
  return [
    `Name: ${message.name}`,
    `Email: ${message.email}`,
    `I am: ${audienceLabel(message.audience)}`,
    "",
    message.message,
  ];
}

/**
 * Builds a mailto: URL with the message pre-filled, for the fallback used before the
 * Supabase / Resend delivery exists. Line breaks are CRLF per RFC 6068.
 */
export function buildMailto(to: string, message: ContactMessage): string {
  const subject = `Message from the HTF website (${audienceLabel(message.audience).toLowerCase()})`;
  const body = contactMessageText(message).join("\r\n");
  return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
