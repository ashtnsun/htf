import { signOut } from "@/app/apply/actions";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { SplitButton } from "@/components/ui/SplitButton";
import {
  formatCycleDeadline,
  formatPortalDate,
  isCycleOpen,
  type ApplicationSummary,
  type Cycle,
} from "@/lib/portal/data";

type AccountPanelProps = {
  email: string;
  cycle: Cycle | null;
  application: ApplicationSummary | null;
  admin: boolean;
};

type StatusCard = {
  title: string;
  body: string;
  cta?: { label: string; href: string; variant?: "primary" | "secondary" };
};

/**
 * What the account can do right now. Decisions are never shown here: every status after
 * "submitted" reads as received, because exec announce decisions by email, not by flipping a
 * status in the dashboard.
 */
function describe(cycle: Cycle | null, application: ApplicationSummary | null): StatusCard {
  if (!cycle) {
    return {
      title: "No cycle is open",
      body: "Applications are not being taken right now. Follow us on Instagram to hear when the next cycle opens.",
    };
  }
  const open = isCycleOpen(cycle);
  const deadline = formatCycleDeadline(cycle);
  if (!application) {
    return open
      ? {
          title: "Not started",
          body: `Your answers save as you go, and you can come back any time before ${deadline}.`,
          cta: { label: "Start your application", href: "/apply/form" },
        }
      : {
          title: "Applications closed",
          body: `${cycle.name} applications closed ${deadline}. Follow us on Instagram to hear when the next cycle opens.`,
        };
  }
  if (application.status === "draft") {
    return open
      ? {
          title: "Draft in progress",
          body: `Last saved ${formatPortalDate(application.updated_at)}. Submit before ${deadline}.`,
          cta: { label: "Continue your application", href: "/apply/form" },
        }
      : {
          title: "Draft not submitted",
          body: `The deadline passed ${deadline} before this application was submitted.`,
          cta: { label: "View your draft", href: "/apply/form", variant: "secondary" },
        };
  }
  return {
    title: "Submitted",
    body: `Received ${formatPortalDate(application.submitted_at ?? application.updated_at)}. We read every application after the deadline and follow up by email.`,
    cta: { label: "View your application", href: "/apply/form", variant: "secondary" },
  };
}

/** Signed-in view of the /apply landing: who you are, where your application stands. */
export function AccountPanel({ email, cycle, application, admin }: AccountPanelProps) {
  const status = describe(cycle, application);
  return (
    <div className="space-y-6">
      <div className="border border-line bg-surface p-6 sm:p-8">
        <Eyebrow>{cycle ? `Your application · ${cycle.name}` : "Your application"}</Eyebrow>
        <p className="mt-4 font-display text-h3 font-medium text-text">{status.title}</p>
        <p className="mt-3 max-w-prose text-muted">{status.body}</p>
        {status.cta ? (
          <SplitButton href={status.cta.href} variant={status.cta.variant} className="mt-8">
            {status.cta.label}
          </SplitButton>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 border border-line glass p-6">
        <div className="min-w-0">
          <Eyebrow tone="green">Signed in</Eyebrow>
          <p className="mt-2 break-all text-text">{email}</p>
        </div>
        <form action={signOut}>
          <SplitButton type="submit" variant="secondary">
            Sign out
          </SplitButton>
        </form>
      </div>

      {admin ? (
        <div className="flex flex-wrap items-center justify-between gap-4 border border-line bg-surface p-6">
          <div>
            <Eyebrow tone="muted">Exec</Eyebrow>
            <p className="mt-2 text-text">This account is on the exec list.</p>
          </div>
          <SplitButton href="/admin" variant="secondary">
            Open the admin dashboard
          </SplitButton>
        </div>
      ) : null}
    </div>
  );
}
