import "server-only";
import { audienceLabel, type ContactMessage } from "./schema";

/**
 * Where contact messages go. Chosen from environment variables so the same build works
 * before and after the Supabase project exists:
 *
 *   SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY  -> insert into public.contact_messages
 *                                                (supabase/migrations/*_contact_messages.sql)
 *   RESEND_API_KEY + CONTACT_INBOX             -> notification email through Resend
 *                                                (CONTACT_FROM must be a verified sender)
 *
 * Both may be on at once (store + notify). With neither, the page falls back to a mailto:
 * form (see src/app/contact/page.tsx). Keys stay server-side: never prefix them NEXT_PUBLIC_.
 */

export type ContactDelivery = "supabase" | "email";

function env(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

export function getContactDeliveries(): ContactDelivery[] {
  const deliveries: ContactDelivery[] = [];
  if (env("SUPABASE_URL") && env("SUPABASE_SERVICE_ROLE_KEY")) deliveries.push("supabase");
  if (env("RESEND_API_KEY") && env("CONTACT_INBOX")) deliveries.push("email");
  return deliveries;
}

export function isContactFormConfigured(): boolean {
  return getContactDeliveries().length > 0;
}

async function storeInSupabase(message: ContactMessage): Promise<void> {
  const url = env("SUPABASE_URL")!.replace(/\/+$/, "");
  const key = env("SUPABASE_SERVICE_ROLE_KEY")!;
  const res = await fetch(`${url}/rest/v1/contact_messages`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(message),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Supabase insert failed with HTTP ${res.status}`);
  }
}

async function emailViaResend(message: ContactMessage): Promise<void> {
  const apiKey = env("RESEND_API_KEY")!;
  const inbox = env("CONTACT_INBOX")!;
  const from = env("CONTACT_FROM") ?? "Hack the Future website <onboarding@resend.dev>";
  const who = audienceLabel(message.audience);
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [inbox],
      reply_to: message.email,
      subject: `[HTF website] ${message.name} (${who.toLowerCase()})`,
      // Plain text only: nothing from the form is ever interpreted as HTML.
      text: [
        `Name: ${message.name}`,
        `Email: ${message.email}`,
        `I am: ${who}`,
        "",
        message.message,
      ].join("\n"),
    }),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Resend request failed with HTTP ${res.status}`);
  }
}

/**
 * Delivers to every configured sink. Resolves when at least one succeeded (the message is
 * not lost); a failed secondary sink is logged. Rejects when nothing accepted the message.
 * Message contents are never logged.
 */
export async function deliverContactMessage(message: ContactMessage): Promise<void> {
  const deliveries = getContactDeliveries();
  if (deliveries.length === 0) {
    throw new Error("Contact form delivery is not configured");
  }
  const results = await Promise.allSettled(
    deliveries.map((d) => (d === "supabase" ? storeInSupabase(message) : emailViaResend(message))),
  );
  const failures = results.filter((r): r is PromiseRejectedResult => r.status === "rejected");
  if (failures.length === results.length) {
    throw failures[0]!.reason;
  }
  for (const failure of failures) {
    console.error("[contact] secondary delivery failed:", failure.reason);
  }
}
