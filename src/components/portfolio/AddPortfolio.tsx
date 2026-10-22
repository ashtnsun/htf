"use client";

import { Plus } from "lucide-react";
import { useActionState, useId, useState } from "react";
import type { FormState } from "@/app/portfolio/actions";
import { SplitButton } from "@/components/ui/SplitButton";

export const underlineInput =
  "w-full border-b border-line-strong bg-transparent py-2 text-sm text-text transition-colors placeholder:text-muted hover:border-muted focus-visible:border-text focus-visible:outline-none";

/**
 * Add a link to a grid. On the community page it waits behind a dashed cell ("Add a
 * portfolio") and folds back once the link is in; on /portfoliohost it stays open. The server
 * takes a screenshot before it answers, so the button spins for a few seconds.
 */
export function AddPortfolio({
  action,
  alwaysOpen = false,
  nameLabel,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  alwaysOpen?: boolean;
  nameLabel: string;
}) {
  const id = useId();
  const [state, formAction, pending] = useActionState(action, {});
  // Open for the form state it was opened on, so a successful add (a new `done`) closes it.
  const [openFor, setOpenFor] = useState<number | null | undefined>(null);
  const open = alwaysOpen || openFor === state.done;

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpenFor(state.done)}
        className="hover-corners flex aspect-[16/10] w-full flex-col items-center justify-center gap-2 border border-dashed border-line-strong text-sm text-muted transition-colors hover:text-text"
      >
        <Plus aria-hidden className="size-5" />
        Add a portfolio
        <span className="text-muted">Yours, or one you like</span>
      </button>
    );
  }

  return (
    <form
      key={state.done}
      action={formAction}
      className={alwaysOpen ? "grid gap-5" : "grid min-h-full gap-5 border border-line p-5"}
    >
      <div>
        <label htmlFor={`${id}-url`} className="text-sm text-muted">
          Link
        </label>
        <input
          id={`${id}-url`}
          name="url"
          type="text"
          inputMode="url"
          autoComplete="url"
          required
          autoFocus={!alwaysOpen}
          defaultValue={state.values?.url}
          placeholder="jane.design"
          aria-invalid={state.error ? true : undefined}
          aria-describedby={state.error ? `${id}-error` : undefined}
          className={underlineInput}
        />
      </div>
      <div>
        <label htmlFor={`${id}-title`} className="text-sm text-muted">
          {nameLabel} <span className="text-muted/70">(optional)</span>
        </label>
        <input
          id={`${id}-title`}
          name="title"
          type="text"
          maxLength={80}
          defaultValue={state.values?.title}
          placeholder="We'll use the site's title"
          className={underlineInput}
        />
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <SplitButton type="submit" pending={pending}>
          Add
        </SplitButton>
        {alwaysOpen ? null : (
          <button
            type="button"
            onClick={() => setOpenFor(null)}
            className="min-h-11 text-sm text-muted transition-colors hover:text-text"
          >
            Cancel
          </button>
        )}
      </div>
      <p aria-live="polite" className="text-sm text-muted empty:hidden">
        {pending ? "Taking a screenshot. This takes a few seconds." : null}
      </p>
      {state.error && !pending ? (
        <p id={`${id}-error`} role="alert" className="text-sm text-cyan">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
