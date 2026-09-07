import "server-only";

/**
 * Where form submissions go (contact messages, nonprofit inquiries). Chosen from environment
 * variables so the same build works before and after the Supabase project exists:
 *
 *   SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY  -> insert into the submission's table
 *                                                (supabase/migrations/*.sql)
 *   RESEND_API_KEY + CONTACT_INBOX             -> notification email through Resend
 *                                                (CONTACT_FROM must be a verified sender)
 *
 * Both may be on at once (store + notify). With neither, the forms fall back to mailto:
 * (see src/app/contact/page.tsx and src/app/nonprofits/page.tsx). Keys stay server-side:
 * never prefix them NEXT_PUBLIC_.
 */

export type FormDelivery = "supabase" | "email";

export type Submission = {
  /** Supabase table (public schema). Column names are the record's keys. */
  table: string;
  record: Record<string, string | number | boolean | null>;
  email: { subject: string; text: string; replyTo: string };
};

function env(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

export function getFormDeliveries(): FormDelivery[] {
  const deliveries: FormDelivery[] = [];
  if (env("SUPABASE_URL") && env("SUPABASE_SERVICE_ROLE_KEY")) deliveries.push("supabase");
  if (env("RESEND_API_KEY") && env("CONTACT_INBOX")) deliveries.push("email");
  return deliveries;
}

export function isFormDeliveryConfigured(): boolean {
  return getFormDeliveries().length > 0;
}

async function storeInSupabase({ table, record }: Submission): Promise<void> {
  const url = env("SUPABASE_URL")!.replace(/\/+$/, "");
  const key = env("SUPABASE_SERVICE_ROLE_KEY")!;
  const res = await fetch(`${url}/rest/v1/${table}`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(record),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Supabase insert into ${table} failed with HTTP ${res.status}`);
  }
}

async function emailViaResend({ email }: Submission): Promise<void> {
  const apiKey = env("RESEND_API_KEY")!;
  const inbox = env("CONTACT_INBOX")!;
  const from = env("CONTACT_FROM") ?? "Hack the Future website <onboarding@resend.dev>";
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [inbox],
      reply_to: email.replyTo,
      subject: email.subject,
      // Plain text only: nothing from a form is ever interpreted as HTML.
      text: email.text,
    }),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Resend request failed with HTTP ${res.status}`);
  }
}

/**
 * Delivers to every configured sink. Resolves when at least one succeeded (the submission
 * is not lost); a failed secondary sink is logged. Rejects when nothing accepted it.
 * Submission contents are never logged.
 */
export async function deliverSubmission(submission: Submission): Promise<void> {
  const deliveries = getFormDeliveries();
  if (deliveries.length === 0) {
    throw new Error("Form delivery is not configured");
  }
  const results = await Promise.allSettled(
    deliveries.map((d) =>
      d === "supabase" ? storeInSupabase(submission) : emailViaResend(submission),
    ),
  );
  const failures = results.filter((r): r is PromiseRejectedResult => r.status === "rejected");
  if (failures.length === results.length) {
    throw failures[0]!.reason;
  }
  for (const failure of failures) {
    console.error(`[forms] secondary delivery for ${submission.table} failed:`, failure.reason);
  }
}
