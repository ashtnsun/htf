"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Plus } from "lucide-react";
import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export type AccordionItem = {
  id: string;
  title: string;
  content: ReactNode;
};

type AccordionProps = {
  items: AccordionItem[];
  /** id of the item open on first render. */
  defaultOpen?: string;
  className?: string;
};

/**
 * Single-open accordion. Native buttons carry aria-expanded/aria-controls, panels are
 * regions labelled by their header, and Arrow/Home/End keys move between headers.
 * The open item takes the surface background with a green title, like the Framer FAQ.
 */
export function Accordion({ items, defaultOpen, className }: AccordionProps) {
  const [openId, setOpenId] = useState<string | null>(defaultOpen ?? null);
  const reduce = useReducedMotion();
  const baseId = useId();
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);

  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>, index: number) {
    const count = items.length;
    const targets: Record<string, number> = {
      ArrowDown: index + 1,
      ArrowUp: index - 1,
      Home: 0,
      End: count - 1,
    };
    const next = targets[e.key];
    if (next === undefined) return;
    e.preventDefault();
    buttons.current[(next + count) % count]?.focus();
  }

  return (
    <div className={cn("divide-y divide-line border-y border-line", className)}>
      {items.map((item, index) => {
        const open = item.id === openId;
        const headerId = `${baseId}-${item.id}-h`;
        const panelId = `${baseId}-${item.id}-p`;
        return (
          <div key={item.id} className={cn("transition-colors duration-300", open && "bg-surface")}>
            <h3 className="m-0">
              <button
                ref={(el) => {
                  buttons.current[index] = el;
                }}
                id={headerId}
                type="button"
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => setOpenId(open ? null : item.id)}
                onKeyDown={(e) => onKeyDown(e, index)}
                className={cn(
                  "flex w-full items-center justify-between gap-6 px-5 py-5 text-left text-base font-medium md:px-6 md:text-body-lg",
                  "transition-colors duration-200 hover:text-text focus-visible:outline-offset-[-3px]",
                  open ? "text-green" : "text-muted",
                )}
              >
                <span>{item.title}</span>
                <Plus
                  aria-hidden="true"
                  className={cn(
                    "size-5 shrink-0 transition-transform duration-300 ease-out-expo",
                    open ? "rotate-45 text-green" : "text-muted",
                  )}
                />
              </button>
            </h3>
            <AnimatePresence initial={false}>
              {open ? (
                <motion.div
                  key="panel"
                  id={panelId}
                  role="region"
                  aria-labelledby={headerId}
                  initial={reduce ? false : { height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={reduce ? undefined : { height: 0, opacity: 0 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden"
                >
                  <div className="px-5 pb-6 text-muted md:px-6 md:pr-16">{item.content}</div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
