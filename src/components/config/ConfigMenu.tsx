"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { Eyebrow } from "@/components/ui/Eyebrow";
import {
  DEFAULT_HERO,
  DEFAULT_INVOLVED,
  HERO_VARIANTS,
  INVOLVED_VARIANTS,
} from "@/lib/config/options";
import { isDefaultConfig, resetSiteConfig, setSiteConfig, useSiteConfig } from "@/lib/config/store";
import { cn } from "@/lib/utils";

/** true on the client after hydration, false during SSR; no effect/setState needed. */
const subscribeNoop = () => () => {};
const useIsClient = () =>
  useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );

/** The shortcut must not fire while someone is typing in a form. */
function isTyping(target: EventTarget | null): boolean {
  const el = target instanceof Element ? target : null;
  return Boolean(
    el?.closest("input, textarea, select, [contenteditable]:not([contenteditable='false'])"),
  );
}

/** Pages that end with the Get involved block (layout/ContactCta). */
function hasGetInvolved(pathname: string): boolean {
  return (
    pathname === "/" ||
    pathname === "/about" ||
    pathname === "/students" ||
    pathname.startsWith("/projects")
  );
}

const linkClass = "font-medium text-green transition-colors duration-200 hover:text-text";

/**
 * The site configuration panel: Shift + M opens and closes it on every page. It is a
 * non-modal dialog on the right edge (no backdrop, no scroll lock) so the page stays live
 * while a choice is tried out; Escape closes it and focus goes back where it was. Choices are
 * saved per browser through src/lib/config/store.ts and apply immediately.
 */
export function ConfigMenu() {
  const [open, setOpen] = useState(false);
  const isClient = useIsClient();
  const reduce = useReducedMotion();
  const pathname = usePathname();
  const config = useSiteConfig();
  const panelRef = useRef<HTMLDivElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.defaultPrevented || e.repeat || e.isComposing) return;
      if (e.key === "Escape" && open) {
        e.preventDefault();
        close();
        return;
      }
      const isShortcut =
        e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey && (e.code === "KeyM" || e.key === "M");
      if (isShortcut && !isTyping(e.target)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  // Move focus into the panel on open and back out on close.
  useEffect(() => {
    if (!open) return;
    returnFocus.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const panel = panelRef.current;
    const first =
      panel?.querySelector<HTMLElement>("input:checked") ??
      panel?.querySelector<HTMLElement>("button");
    first?.focus();
    return () => {
      returnFocus.current?.focus();
    };
  }, [open]);

  const transition = reduce ? { duration: 0 } : { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const };

  if (!isClient) return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          ref={panelRef}
          id="site-config"
          role="dialog"
          aria-label="Site configuration"
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={transition}
          className="fixed inset-y-0 right-0 z-[70] flex w-[min(100%,24rem)] flex-col border-l border-line-strong glass [--glass-alpha:90%]"
        >
          <div className="flex h-(--header-h) shrink-0 items-stretch border-b border-line">
            <button
              type="button"
              onClick={close}
              aria-label="Close configuration"
              className="flex w-14 items-center justify-center border-r border-line bg-green text-bg focus-visible:outline-offset-[-3px]"
            >
              <X className="size-5" aria-hidden="true" />
            </button>
            <div className="flex flex-1 items-center justify-between gap-4 px-4">
              <span className="text-sm font-medium text-text">Site configuration</span>
              <span className="flex items-center gap-1 text-xs text-muted">
                <Key>Shift</Key>
                <span aria-hidden="true">+</span>
                <Key>M</Key>
              </span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-6">
            <p className="text-sm text-muted">
              Choices are saved in this browser only. Visitors see the defaults.
            </p>

            <VariantPicker
              legend="Home hero"
              name="hero-variant"
              options={HERO_VARIANTS}
              value={config.hero}
              defaultId={DEFAULT_HERO}
              onChange={(hero) => setSiteConfig({ hero })}
              note={
                pathname !== "/" ? (
                  <>
                    The hero is on the{" "}
                    <Link href="/" className={linkClass}>
                      home page
                    </Link>
                    .
                  </>
                ) : null
              }
            />

            <VariantPicker
              legend="Get involved graphic"
              name="involved-variant"
              options={INVOLVED_VARIANTS}
              value={config.involved}
              defaultId={DEFAULT_INVOLVED}
              onChange={(involved) => setSiteConfig({ involved })}
              note={
                hasGetInvolved(pathname) ? (
                  <>
                    Get involved is at the{" "}
                    <a href="#get-involved" className={linkClass}>
                      foot of this page
                    </a>
                    .
                  </>
                ) : (
                  <>
                    Get involved is at the foot of the{" "}
                    <Link href="/#get-involved" className={linkClass}>
                      home page
                    </Link>
                    , About, Projects and Students.
                  </>
                )
              }
            />
          </div>

          <div className="flex shrink-0 items-center justify-between border-t border-line px-5 py-3">
            <button
              type="button"
              onClick={resetSiteConfig}
              disabled={isDefaultConfig(config)}
              className="min-h-11 text-sm font-medium text-muted transition-colors duration-200 hover:text-green disabled:pointer-events-none disabled:opacity-40"
            >
              Reset to defaults
            </button>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}

function Key({ children }: { children: string }) {
  return (
    <kbd className="border border-line-strong px-1.5 py-0.5 font-body text-[11px] font-medium text-text">
      {children}
    </kbd>
  );
}

type VariantOption<Id extends string> = {
  readonly id: Id;
  readonly name: string;
  readonly blurb: string;
};

type VariantPickerProps<Id extends string> = {
  legend: string;
  /** The radio group's name. */
  name: string;
  options: readonly VariantOption<Id>[];
  value: Id;
  defaultId: Id;
  onChange: (id: Id) => void;
  /** Where to see the choice, shown under the list. */
  note?: React.ReactNode;
};

/** One setting: a row per variant, the selection applied on change. */
function VariantPicker<Id extends string>({
  legend,
  name,
  options,
  value,
  defaultId,
  onChange,
  note,
}: VariantPickerProps<Id>) {
  return (
    <fieldset className="mt-8">
      <legend className="mb-4">
        <Eyebrow as="span" tone="green">
          {legend}
        </Eyebrow>
      </legend>
      <div className="border-t border-line">
        {options.map((variant) => {
          const checked = variant.id === value;
          return (
            <label
              key={variant.id}
              className={cn(
                "hover-corners flex cursor-pointer gap-3 border-b border-line px-4 py-3 transition-colors duration-200 hover:bg-surface-2",
                "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-[-2px] has-[:focus-visible]:outline-mint",
                checked && "bg-surface-2",
              )}
            >
              <input
                type="radio"
                name={name}
                value={variant.id}
                checked={checked}
                onChange={() => onChange(variant.id)}
                className="sr-only"
              />
              <span
                aria-hidden="true"
                className={cn(
                  "mt-[0.45rem] size-1.5 shrink-0",
                  checked ? "bg-green" : "border border-line-strong",
                )}
              />
              <span className="min-w-0">
                <span
                  className={cn("block text-sm font-medium", checked ? "text-green" : "text-text")}
                >
                  {variant.name}
                  {variant.id === defaultId ? (
                    <span className="ml-2 text-xs font-normal text-muted">Default</span>
                  ) : null}
                </span>
                <span className="mt-0.5 block text-xs leading-relaxed text-muted">
                  {variant.blurb}
                </span>
              </span>
            </label>
          );
        })}
      </div>
      {note ? <p className="mt-4 text-sm text-muted">{note}</p> : null}
    </fieldset>
  );
}
