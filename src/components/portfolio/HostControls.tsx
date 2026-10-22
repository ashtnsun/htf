"use client";

import { useActionState, useTransition } from "react";
import {
  hostSignIn,
  recapturePortfolio,
  removePortfolio,
  type FormState,
} from "@/app/portfolio/actions";
import { SplitButton } from "@/components/ui/SplitButton";
import { underlineInput } from "./AddPortfolio";

export function HostSignIn() {
  const [state, action, pending] = useActionState<FormState, FormData>(hostSignIn, {});
  return (
    <form action={action} className="grid max-w-sm gap-6">
      <div>
        <label htmlFor="host-password" className="text-sm text-muted">
          Password
        </label>
        <input
          id="host-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          autoFocus
          aria-invalid={state.error ? true : undefined}
          aria-describedby={state.error ? "host-password-error" : undefined}
          className={underlineInput}
        />
      </div>
      <div>
        <SplitButton type="submit" pending={pending}>
          Sign in
        </SplitButton>
      </div>
      {state.error ? (
        <p id="host-password-error" role="alert" className="text-sm text-cyan">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}

/** Recapture (reference only) and Remove for one row of the host's lists. */
export function HostRowActions({
  id,
  title,
  recapture = false,
}: {
  id: string;
  title: string;
  recapture?: boolean;
}) {
  const [pending, start] = useTransition();
  const button =
    "min-h-11 text-sm text-muted transition-colors hover:text-text disabled:opacity-50";
  return (
    <div className="flex shrink-0 items-center gap-5" aria-busy={pending}>
      {recapture ? (
        <button
          type="button"
          disabled={pending}
          onClick={() => start(() => recapturePortfolio(id))}
          className={button}
        >
          {pending ? "Working…" : "Recapture"}
          <span className="sr-only"> {title}</span>
        </button>
      ) : null}
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (window.confirm(`Remove “${title}”?`)) start(() => removePortfolio(id));
        }}
        className={button}
      >
        Remove<span className="sr-only"> {title}</span>
      </button>
    </div>
  );
}
