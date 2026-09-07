import { ArrowUpRight } from "lucide-react";
import {
  isEmptyAnswer,
  STEP_TITLES,
  type SummaryGroup,
  type SummaryItem,
} from "@/lib/apply/schema";
import { cn } from "@/lib/utils";

type ApplicationSummaryProps = {
  groups: SummaryGroup[];
  /** Inside the step form: adds an "Edit" button per group (posts `nav` = the step). */
  editable?: boolean;
  className?: string;
};

const textButton =
  "min-h-11 text-sm text-muted underline decoration-green/70 underline-offset-4 transition-colors hover:text-green";

/**
 * Everything the application holds, as definition lists per step. Used by the review step
 * (with edit buttons) and by the read-only view after submission or the deadline. No hooks,
 * so it renders on the server and inside the client form alike.
 */
export function ApplicationSummary({
  groups,
  editable = false,
  className,
}: ApplicationSummaryProps) {
  return (
    <div className={cn("space-y-10", className)}>
      {groups.map((group, index) => {
        const headingId = `summary-${group.step}-${index}`;
        const stacked = group.step === "questions";
        return (
          <section key={headingId} aria-labelledby={headingId}>
            <div className="flex items-center justify-between gap-4 border-b border-line pb-3">
              <h3 id={headingId} className="text-base font-medium text-text">
                {group.title}
              </h3>
              {editable ? (
                <button
                  type="submit"
                  name="nav"
                  value={group.step}
                  formNoValidate
                  className={textButton}
                >
                  Edit
                  <span className="sr-only"> {STEP_TITLES[group.step]}</span>
                </button>
              ) : null}
            </div>
            <dl className="divide-y divide-line">
              {group.items.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    "grid gap-1 py-4",
                    !stacked && "sm:grid-cols-[minmax(0,12rem)_minmax(0,1fr)] sm:gap-6",
                  )}
                >
                  <dt className={cn("text-sm", stacked ? "text-text" : "text-muted")}>
                    {item.label}
                  </dt>
                  <dd className={cn("min-w-0", stacked ? "mt-1 text-muted" : "text-text")}>
                    <Value item={item} />
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        );
      })}
    </div>
  );
}

function Value({ item }: { item: SummaryItem }) {
  const { value } = item;
  if (value == null || isEmptyAnswer(value)) {
    return (
      <span className="text-muted">{item.required ? "Not answered yet." : "Not provided."}</span>
    );
  }
  if (Array.isArray(value)) {
    return <span>{value.join(", ")}</span>;
  }
  if (item.kind === "link") {
    return (
      <a
        href={value}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex max-w-full items-center gap-1 text-text underline decoration-green/70 underline-offset-4 transition-colors hover:text-green"
      >
        <span className="break-all">{value}</span>
        <ArrowUpRight className="size-4 shrink-0" aria-hidden="true" />
      </a>
    );
  }
  return <span className="break-words whitespace-pre-line">{value}</span>;
}
