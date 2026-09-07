import { Check } from "lucide-react";
import Link from "next/link";
import {
  filtersToParams,
  STATUS_LABELS,
  type ApplicationListRow,
  type Filters,
  type SortKey,
} from "@/lib/portal/admin";
import type { ApplicationStatus } from "@/lib/portal/data";
import { formatPortalDate } from "@/lib/portal/format";
import { Chip } from "@/components/ui/Chip";
import { cn } from "@/lib/utils";

type ApplicationsTableProps = {
  rows: readonly ApplicationListRow[];
  filters: Filters;
};

const headClass = "pb-3 text-left text-eyebrow font-medium text-muted uppercase";
const cellClass = "py-4 pr-4 align-top";

/** Status as a small chip: accepted fills green, the rest are outlined. */
export function StatusChip({ status }: { status: ApplicationStatus }) {
  return (
    <Chip
      selected={status === "accepted"}
      className={cn(
        status === "reviewing" && "border-green text-green",
        status === "submitted" && "text-text",
      )}
    >
      {STATUS_LABELS[status]}
    </Chip>
  );
}

function SortLink({
  label,
  sortKey,
  filters,
}: {
  label: string;
  sortKey: SortKey;
  filters: Filters;
}) {
  const current = filters.sort === sortKey;
  return (
    <Link
      href={`/admin${filtersToParams(filters, { sort: sortKey })}`}
      className={cn(
        "inline-flex min-h-6 items-center gap-1 transition-colors duration-200 hover:text-green",
        current && "text-green",
      )}
    >
      {label}
      {current ? <span className="sr-only"> (sorted)</span> : null}
    </Link>
  );
}

/**
 * The applications list. Every row links to the review page; the sortable headers are links
 * that keep the current filters, so the table needs no JavaScript. Drafts always sort last.
 */
export function ApplicationsTable({ rows, filters }: ApplicationsTableProps) {
  if (rows.length === 0) {
    return (
      <p className="border border-dashed border-line-strong p-6 text-muted">
        No applications match these filters.
      </p>
    );
  }
  return (
    <div className="relative overflow-x-auto">
      <table className="w-full min-w-[56rem] border-b border-line text-sm">
        <caption className="sr-only">Applications</caption>
        <thead>
          <tr>
            <th
              scope="col"
              className={headClass}
              aria-sort={filters.sort === "name" ? "ascending" : undefined}
            >
              <SortLink label="Applicant" sortKey="name" filters={filters} />
            </th>
            <th scope="col" className={headClass}>
              Roles
            </th>
            <th scope="col" className={headClass}>
              Year
            </th>
            <th scope="col" className={headClass}>
              Status
            </th>
            <th
              scope="col"
              className={headClass}
              aria-sort={filters.sort === "submitted" ? "descending" : undefined}
            >
              <SortLink label="Submitted" sortKey="submitted" filters={filters} />
            </th>
            <th
              scope="col"
              className={cn(headClass, "text-right")}
              aria-sort={filters.sort === "score" ? "descending" : undefined}
            >
              <SortLink label="Score" sortKey="score" filters={filters} />
            </th>
            <th scope="col" className={cn(headClass, "pr-0 text-right")}>
              Yours
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const a = row.application;
            return (
              <tr
                key={a.id}
                className="border-t border-line transition-colors duration-200 hover:bg-surface"
              >
                <td className={cellClass}>
                  <Link
                    href={`/admin/applications/${a.id}`}
                    className="font-medium text-text transition-colors duration-200 hover:text-green"
                  >
                    {row.name}
                  </Link>
                  <span className="mt-0.5 block text-xs break-all text-muted">{row.email}</span>
                </td>
                <td className={cn(cellClass, "text-muted")}>
                  {row.roleNames.length > 0 ? row.roleNames.join(", ") : "None yet"}
                </td>
                <td className={cn(cellClass, "text-muted")}>{a.year ?? "Not given"}</td>
                <td className={cellClass}>
                  <StatusChip status={a.status} />
                </td>
                <td className={cn(cellClass, "text-muted tabular-nums")}>
                  {a.submitted_at
                    ? formatPortalDate(a.submitted_at)
                    : `Draft, saved ${formatPortalDate(a.updated_at)}`}
                </td>
                <td className={cn(cellClass, "text-right tabular-nums")}>
                  {row.averageScore == null ? (
                    <span className="text-muted">No score</span>
                  ) : (
                    <span className="text-text">{row.averageScore.toFixed(1)}</span>
                  )}
                  <span className="text-muted">
                    {" "}
                    · {row.reviewCount}
                    <span className="sr-only"> {row.reviewCount === 1 ? "review" : "reviews"}</span>
                  </span>
                </td>
                <td className={cn(cellClass, "pr-0 text-right")}>
                  {row.mine ? (
                    <>
                      <Check className="inline size-4 text-green" aria-hidden="true" />
                      <span className="sr-only">Reviewed by you</span>
                    </>
                  ) : (
                    <span className="sr-only">Not reviewed by you</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
