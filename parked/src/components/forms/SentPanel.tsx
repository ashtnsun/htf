"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { SplitButton } from "@/components/ui/SplitButton";

type SentPanelProps = {
  title: string;
  children: ReactNode;
  /** Remounts the form so it starts empty. */
  onReset: () => void;
  resetLabel?: string;
  eyebrow?: string;
};

/** Confirmation shown in place of a submitted form; takes focus so the outcome is announced. */
export function SentPanel({
  title,
  children,
  onReset,
  resetLabel = "Send another message",
  eyebrow = "Message sent",
}: SentPanelProps) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.focus();
  }, []);
  return (
    <div
      ref={ref}
      tabIndex={-1}
      role="status"
      className="border border-line bg-surface p-6 outline-none sm:p-8"
    >
      <Eyebrow tone="green">{eyebrow}</Eyebrow>
      <p className="mt-4 font-display text-h3 font-medium text-text">{title}</p>
      <p className="mt-3 max-w-prose text-muted">{children}</p>
      <SplitButton variant="secondary" className="mt-8" onClick={onReset}>
        {resetLabel}
      </SplitButton>
    </div>
  );
}
