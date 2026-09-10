"use client";

import { Check, Copy } from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentType,
  type ReactNode,
} from "react";
import { SplitButton } from "@/components/ui/SplitButton";
import { cn } from "@/lib/utils";

/**
 * Puts `text` on the clipboard. The async Clipboard API needs a secure context and a user
 * gesture; where it is missing or refused (an http preview, an older browser) the legacy
 * selection copy still works, so try that before giving up.
 */
async function writeClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through to the legacy path
  }
  try {
    const field = document.createElement("textarea");
    field.value = text;
    field.setAttribute("readonly", "");
    field.style.position = "fixed";
    field.style.opacity = "0";
    document.body.append(field);
    field.select();
    const ok = document.execCommand("copy");
    field.remove();
    return ok;
  } catch {
    return false;
  }
}

type CopyState = "idle" | "copied" | "error";

/** The click handler and the two-and-a-half second feedback window every control shares. */
function useCopy(value: string) {
  const [state, setState] = useState<CopyState>("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const copy = useCallback(() => {
    void writeClipboard(value).then((ok) => {
      setState(ok ? "copied" : "error");
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setState("idle"), 2400);
    });
  }, [value]);

  return { state, copy };
}

/** What assistive tech hears; the visible controls say "Copied" in their own way. */
function LiveNote({ state, email }: { state: CopyState; email: string }) {
  return (
    <span role="status" aria-live="polite" className="sr-only">
      {state === "copied" ? `${email} copied to the clipboard` : null}
      {state === "error" ? `Could not copy. The address is ${email}` : null}
    </span>
  );
}

/** "Copied" / "Copy failed", in the flow of the surrounding text. */
function Flash({ state, className }: { state: CopyState; className?: string }) {
  if (state === "idle") return null;
  return (
    <span aria-hidden="true" className={cn("text-xs font-medium text-green", className)}>
      {state === "copied" ? "Copied" : "Copy failed"}
    </span>
  );
}

type ButtonProps = {
  email: string;
  children?: ReactNode;
  size?: "md" | "lg";
  variant?: "primary" | "secondary";
  className?: string;
};

/**
 * The email CTA: a SplitButton that copies the address instead of opening a mail client
 * (2026-09-10 — nothing on the site is a `mailto:` link any more). The label never changes,
 * so the button keeps its width: the arrow cell shows a tick and "Copied" appears beside it
 * while the feedback lasts.
 */
export function CopyEmailButton({
  email,
  children = "Copy our email",
  size = "lg",
  variant = "primary",
  className,
}: ButtonProps) {
  const { state, copy } = useCopy(email);
  return (
    <span className="inline-flex items-center gap-4">
      <SplitButton
        icon={state === "copied" ? "check" : "copy"}
        variant={variant}
        size={size}
        onClick={copy}
        className={className}
        ariaLabel={`Copy ${email} to the clipboard`}
      >
        {children}
      </SplitButton>
      <Flash state={state} className="text-sm" />
      <LiveNote state={state} email={email} />
    </span>
  );
}

type InlineProps = {
  email: string;
  children?: ReactNode;
  className?: string;
};

/** The address inside a sentence: reads like the site's green inline link, copies on click. */
export function CopyEmailInline({ email, children = email, className }: InlineProps) {
  const { state, copy } = useCopy(email);
  return (
    <span className="inline-flex items-baseline gap-2">
      <button
        type="button"
        onClick={copy}
        aria-label={`Copy ${email} to the clipboard`}
        className={cn(
          // inline-block plus the padding/negative-margin pair grows the hit area to the 24px
          // axe asks for without changing the line box the address sits in
          "-my-0.5 inline-block py-0.5 align-baseline font-medium text-green transition-colors duration-200 hover:text-text",
          className,
        )}
      >
        {children}
      </button>
      <Flash state={state} />
      <LiveNote state={state} email={email} />
    </span>
  );
}

type IconProps = {
  email: string;
  label: string;
  Icon: ComponentType<{ className?: string }>;
  className?: string;
};

/** Icon-only control (the mobile drawer's row of socials). The icon becomes a tick. */
export function CopyEmailIcon({ email, label, Icon, className }: IconProps) {
  const { state, copy } = useCopy(email);
  const Glyph = state === "copied" ? Check : Icon;
  return (
    <button
      type="button"
      onClick={copy}
      aria-label={`${label}: copy ${email}`}
      className={className}
    >
      <Glyph className="size-4.5" />
      <LiveNote state={state} email={email} />
    </button>
  );
}

type ShellProps = {
  email: string;
  children: ReactNode;
  /** inline = the flash follows the content; corner = it sits in the top right of the box. */
  feedback?: "inline" | "corner";
  className?: string;
};

/**
 * Wraps markup the server already rendered (the contact page's tile, the footer's row) in a
 * button that copies the address, so those surfaces keep their own layout.
 */
export function CopyEmailShell({ email, children, feedback = "inline", className }: ShellProps) {
  const { state, copy } = useCopy(email);
  return (
    <button
      type="button"
      onClick={copy}
      aria-label={`Copy ${email} to the clipboard`}
      className={cn(feedback === "corner" && "relative", className)}
    >
      {children}
      <Flash
        state={state}
        className={feedback === "corner" ? "absolute top-6 right-6 md:top-8 md:right-8" : undefined}
      />
      <LiveNote state={state} email={email} />
    </button>
  );
}

export { Copy as CopyIcon };
