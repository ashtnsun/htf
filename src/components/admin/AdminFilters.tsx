import Link from "next/link";
import { YEARS, type Role } from "@/lib/apply/schema";
import { STATUS_LABELS, type Filters } from "@/lib/portal/admin";
import { APPLICATION_STATUSES } from "@/lib/portal/data";
import { SelectField, TextField } from "@/components/ui/Field";
import { SplitButton } from "@/components/ui/SplitButton";

type AdminFiltersProps = {
  filters: Filters;
  roles: readonly Role[];
  /** True when any filter is set, which shows the Clear link. */
  active: boolean;
};

const REVIEWED_LABELS = [
  { value: "me", label: "Reviewed by me" },
  { value: "not-me", label: "Not reviewed by me yet" },
  { value: "none", label: "Not reviewed by anyone" },
];

/**
 * The dashboard's filter bar: a plain GET form, so every combination is a URL that can be
 * shared or bookmarked and the page stays a server component (no JavaScript needed).
 */
export function AdminFilters({ filters, roles, active }: AdminFiltersProps) {
  return (
    <form
      method="get"
      action="/admin"
      className="grid gap-4 border border-line bg-surface p-5 sm:grid-cols-2 lg:grid-cols-[1.5fr_repeat(4,1fr)_auto] lg:items-end"
      aria-label="Filter applications"
    >
      <TextField
        id="filter-q"
        name="q"
        type="search"
        label="Search"
        placeholder="Name, email, major"
        defaultValue={filters.q}
        maxLength={100}
        required={false}
        optionalNote={false}
      />
      <SelectField
        id="filter-status"
        name="status"
        label="Status"
        placeholder="All statuses"
        defaultValue={filters.status}
        options={APPLICATION_STATUSES.map((status) => ({
          value: status,
          label: STATUS_LABELS[status],
        }))}
        required={false}
        optionalNote={false}
      />
      <SelectField
        id="filter-role"
        name="role"
        label="Role"
        placeholder="All roles"
        defaultValue={filters.role}
        options={roles.map((role) => ({ value: role.id, label: role.name }))}
        required={false}
        optionalNote={false}
      />
      <SelectField
        id="filter-year"
        name="year"
        label="Year"
        placeholder="All years"
        defaultValue={filters.year}
        options={YEARS.map((year) => ({ value: year, label: year }))}
        required={false}
        optionalNote={false}
      />
      <SelectField
        id="filter-reviewed"
        name="reviewed"
        label="Reviews"
        placeholder="Any"
        defaultValue={filters.reviewed}
        options={REVIEWED_LABELS}
        required={false}
        optionalNote={false}
      />
      {filters.sort !== "submitted" ? (
        <input type="hidden" name="sort" value={filters.sort} />
      ) : null}
      <div className="flex flex-wrap items-center gap-4 sm:col-span-2 lg:col-span-1">
        <SplitButton type="submit" variant="secondary">
          Filter
        </SplitButton>
        {active ? (
          <Link
            href="/admin"
            className="inline-flex min-h-11 items-center text-sm font-medium text-green transition-colors duration-200 hover:text-text"
          >
            Clear
          </Link>
        ) : null}
      </div>
    </form>
  );
}
