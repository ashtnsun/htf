"use client";

import { motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { useReducedMotionSafe } from "@/components/motion/useReducedMotionSafe";
import { DURATION, EASE_GLIDE } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { cinzel } from "../fonts";
import { ButtonFace } from "./looks";
import {
  BUTTON_HOVERS,
  BUTTON_STYLES,
  DEFAULT_BUTTON_HOVER,
  DEFAULT_BUTTON_STYLE,
  setButtonHover,
  setButtonStyle,
  useButtonHover,
  useButtonStyle,
  type ButtonHoverId,
  type ButtonStyleId,
} from "./store";

const noop = () => () => {};
const useIsClient = () =>
  useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );

/** "g" must not fire while someone types: in a field, or on a board that reads the keyboard. */
function keysTaken(target: EventTarget | null): boolean {
  const el = target instanceof Element ? target : null;
  return Boolean(
    el?.closest("input, textarea, select, [contenteditable]:not([contenteditable='false'])") ||
    document.querySelector("[data-reads-keys]"),
  );
}

/**
 * The button-style menu on /olympus and /oracle: "g" opens and closes it (Escape closes). A
 * non-modal panel on the right edge, so the page stays live while a look is tried; each choice
 * shows a preview and applies at once, saved in this browser only.
 */
export function ButtonMenu() {
  const [open, setOpen] = useState(false);
  const isClient = useIsClient();
  const reduce = useReducedMotionSafe();
  const look = useButtonStyle();
  const hover = useButtonHover();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.defaultPrevented || e.repeat || e.isComposing) return;
      if (e.key === "Escape" && open) {
        setOpen(false);
        return;
      }
      if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return;
      if ((e.key === "g" || e.key === "G") && !keysTaken(e.target)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const back = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    panelRef.current?.querySelector<HTMLElement>("input:checked")?.focus();
    return () => back?.focus();
  }, [open]);

  if (!isClient || !open) return null;

  return createPortal(
    <motion.div
      ref={panelRef}
      role="dialog"
      aria-label="Olympus buttons"
      initial={reduce ? false : { x: "100%" }}
      animate={{ x: 0 }}
      transition={{ duration: DURATION.panel, ease: EASE_GLIDE }}
      className={`${cinzel.variable} fixed inset-y-0 right-0 z-[70] flex w-[min(100%,26rem)] flex-col border-l border-line-strong glass [--glass-alpha:92%]`}
    >
      <div className="flex h-16 shrink-0 items-stretch border-b border-line">
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close"
          className="flex w-14 items-center justify-center border-r border-line bg-green text-bg focus-visible:outline-offset-[-3px]"
        >
          <X className="size-5" aria-hidden="true" />
        </button>
        <div className="flex flex-1 items-center justify-between gap-4 px-4">
          <span className="text-sm font-medium text-text">Olympus buttons</span>
          <kbd className="border border-line-strong px-1.5 py-0.5 font-body text-xs text-muted">
            G
          </kbd>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-6">
        <p className="text-sm text-muted">
          Saved in this browser only; everyone else sees Meander keys with Double rule. Hover a
          preview to see its hover.
        </p>
        <Picker
          legend="Hover"
          name="olympus-button-hover"
          options={BUTTON_HOVERS}
          value={hover}
          defaultId={DEFAULT_BUTTON_HOVER}
          onChange={setButtonHover}
          preview={(id) => ({ look, hover: id })}
        />
        <Picker
          legend="Look"
          name="olympus-button-style"
          options={BUTTON_STYLES}
          value={look}
          defaultId={DEFAULT_BUTTON_STYLE}
          onChange={setButtonStyle}
          preview={(id) => ({ look: id, hover })}
        />
      </div>
    </motion.div>,
    document.body,
  );
}

/** One setting: a radio per option, each with a live Begin / Back preview to hover. */
function Picker<T extends string>({
  legend,
  name,
  options,
  value,
  defaultId,
  onChange,
  preview,
}: {
  legend: string;
  name: string;
  options: readonly { id: T; label: string; note: string }[];
  value: T;
  defaultId: T;
  onChange: (id: T) => void;
  preview: (id: T) => { look: ButtonStyleId; hover: ButtonHoverId };
}) {
  return (
    <fieldset className="mt-8">
      <legend className="text-eyebrow text-muted">{legend}</legend>
      <ul className="mt-4 flex flex-col gap-3">
        {options.map((option, i) => {
          const checked = value === option.id;
          const face = preview(option.id);
          return (
            <li key={option.id}>
              <label
                className={cn(
                  "hover-corners block cursor-pointer border px-4 py-4 transition-colors",
                  checked
                    ? "border-green bg-surface-2"
                    : "border-line hover:border-line-strong hover:bg-surface-2",
                )}
              >
                <span className="flex items-center gap-3">
                  <input
                    type="radio"
                    name={name}
                    value={option.id}
                    checked={checked}
                    onChange={() => onChange(option.id)}
                    className="size-4 accent-[var(--green)]"
                  />
                  <span className="text-xs text-muted tabular-nums">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-sm font-medium text-text">{option.label}</span>
                  {option.id === defaultId ? (
                    <span className="ml-auto text-eyebrow text-muted">Default</span>
                  ) : null}
                </span>
                <span className="mt-1 block pl-7 text-xs text-muted">{option.note}</span>
                <span className="mt-5 mb-3 flex flex-wrap items-end gap-x-5 gap-y-4 pl-7">
                  <ButtonFace
                    as="span"
                    variant="primary"
                    pending={false}
                    id={`${name}-${option.id}-p`}
                    {...face}
                  >
                    Begin
                  </ButtonFace>
                  <ButtonFace
                    as="span"
                    variant="secondary"
                    pending={false}
                    id={`${name}-${option.id}-s`}
                    {...face}
                  >
                    Back
                  </ButtonFace>
                </span>
              </label>
            </li>
          );
        })}
      </ul>
    </fieldset>
  );
}
