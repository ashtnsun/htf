import type { ReactNode } from "react";

/** A Portfolio Night section beside the side menu: one quiet heading line, then the content. */
export function PortfolioPage({
  title,
  blurb,
  children,
}: {
  title: string;
  blurb: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="px-6 pt-4 pb-16 lg:px-10 lg:pt-10">
      <header className="mb-8 max-w-xl lg:mb-10">
        <h1 className="text-lg font-medium text-text">{title}</h1>
        <p className="mt-1 text-sm text-muted">{blurb}</p>
      </header>
      {children}
    </div>
  );
}

/** Shown in place of the content when Supabase is unset or unreachable. */
export function Offline() {
  return (
    <p className="text-sm text-muted">
      This isn&apos;t connected right now. Refresh in a minute, or find a host.
    </p>
  );
}
