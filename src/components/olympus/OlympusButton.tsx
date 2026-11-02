"use client";

import { useId, type MouseEventHandler, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ButtonFace } from "./buttons/looks";
import { useButtonHover, useButtonStyle } from "./buttons/store";

/**
 * The /olympus and /oracle button, in the inscription capitals with a Greek ornament. Which of
 * the ten looks it wears (buttons/looks.tsx) is chosen per browser in the "g" menu
 * (buttons/ButtonMenu); visitors see the default, the Meander keys. The hover is a
 * second setting in the same menu (Double rule by default). Nothing moves.
 */
export function OlympusButton({
  children,
  variant = "primary",
  type = "button",
  disabled = false,
  pending = false,
  onClick,
  className,
}: {
  children: ReactNode;
  variant?: "primary" | "secondary";
  type?: "button" | "submit";
  disabled?: boolean;
  /** Shows a spinner in place of the trailing ornament and announces the busy state. */
  pending?: boolean;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  className?: string;
}) {
  const look = useButtonStyle();
  const hover = useButtonHover();
  const id = useId();
  return (
    <ButtonFace
      look={look}
      hover={hover}
      variant={variant}
      pending={pending}
      id={id}
      type={type}
      disabled={disabled || pending}
      aria-busy={pending || undefined}
      onClick={onClick}
      className={cn((disabled || pending) && "pointer-events-none opacity-60", className)}
    >
      {children}
    </ButtonFace>
  );
}
