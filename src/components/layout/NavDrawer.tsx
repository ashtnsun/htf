"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  FolderKanban,
  GraduationCap,
  HeartHandshake,
  House,
  Mail,
  Menu,
  MessageSquare,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { site } from "@content/site";
import { InstagramIcon, LinkedinIcon } from "@/components/icons/Social";
import { Logo } from "@/components/brand/Logo";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { SplitButton } from "@/components/ui/SplitButton";
import { cn, isTodo } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  "/": House,
  "/projects": FolderKanban,
  "/about": Users,
  "/students": GraduationCap,
  "/nonprofits": HeartHandshake,
  "/contact": MessageSquare,
};

/** true on the client after hydration, false during SSR; no effect/setState needed. */
const subscribeNoop = () => () => {};
const useIsClient = () =>
  useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );

const FOCUSABLE =
  'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

type NavDrawerProps = { cta: { label: string; href: string } };

/**
 * Mobile-only burger + full-height drawer (2-column icon grid, socials at the bottom).
 * Focus is trapped inside the dialog, Escape closes, body scroll locks, and the drawer
 * closes on navigation. Hidden on lg+ where the links are visible in the bar.
 */
export function NavDrawer({ cta }: NavDrawerProps) {
  const [open, setOpen] = useState(false);
  const isClient = useIsClient();
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => setOpen(false), []);

  // Close on route change (derived-state pattern: adjust during render, no effect).
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setOpen(false);
  }

  // Scroll lock + focus management + key handling while open.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const panel = panelRef.current;
    const trigger = triggerRef.current;
    const first = panel?.querySelector<HTMLElement>(FOCUSABLE);
    first?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
        return;
      }
      if (e.key !== "Tab" || !panel) return;
      const nodes = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (n) => !n.hasAttribute("disabled") && n.offsetParent !== null,
      );
      if (nodes.length === 0) return;
      const firstNode = nodes[0]!;
      const lastNode = nodes[nodes.length - 1]!;
      if (e.shiftKey && document.activeElement === firstNode) {
        e.preventDefault();
        lastNode.focus();
      } else if (!e.shiftKey && document.activeElement === lastNode) {
        e.preventDefault();
        firstNode.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
      trigger?.focus();
    };
  }, [open, close]);

  const links = [...site.nav, { label: "Contact", href: "/contact" }];
  const socials = [
    { label: "Instagram", href: site.socials.instagram, Icon: InstagramIcon },
    { label: "LinkedIn", href: site.socials.linkedin, Icon: LinkedinIcon },
    {
      label: "Email",
      href: `mailto:${site.socials.email}`,
      Icon: Mail,
      todo: isTodo(site.socials.email),
    },
  ].filter((s) => !s.todo && !isTodo(s.href));

  const transition = reduce
    ? { duration: 0 }
    : { duration: 0.45, ease: [0.16, 1, 0.3, 1] as const };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-controls="site-drawer"
        aria-label="Open menu"
        onClick={() => setOpen(true)}
        className="flex w-14 items-center justify-center border-r border-line text-text transition-colors duration-200 hover:bg-surface-2 hover:text-green focus-visible:outline-offset-[-3px] lg:hidden"
      >
        <Menu className="size-5" aria-hidden="true" />
      </button>

      {/* Portalled to <body>: the header's backdrop-filter would otherwise become the
          containing block for this fixed overlay and clip it to the header's height. */}
      {isClient
        ? createPortal(
            <AnimatePresence>
              {open ? (
                <div className="fixed inset-0 z-[60] lg:hidden">
                  <motion.button
                    type="button"
                    aria-label="Close menu"
                    tabIndex={-1}
                    onClick={close}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={transition}
                    className="absolute inset-0 bg-black/70 backdrop-blur-[2px]"
                  />
                  <motion.div
                    ref={panelRef}
                    id="site-drawer"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Site menu"
                    initial={{ x: "-100%" }}
                    animate={{ x: 0 }}
                    exit={{ x: "-100%" }}
                    transition={transition}
                    className="absolute inset-y-0 left-0 flex w-[min(100%,26rem)] flex-col border-r border-line-strong glass [--glass-alpha:88%]"
                  >
                    <div className="flex h-(--header-h) shrink-0 items-stretch border-b border-line">
                      <button
                        type="button"
                        onClick={close}
                        aria-label="Close menu"
                        className="flex w-14 items-center justify-center border-r border-line bg-green text-bg focus-visible:outline-offset-[-3px]"
                      >
                        <X className="size-5" aria-hidden="true" />
                      </button>
                      <div className="flex items-center px-4">
                        <Logo height={18} title="" />
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto px-5 py-6">
                      <Eyebrow tone="green" className="mb-5">
                        Menu
                      </Eyebrow>
                      <nav aria-label="Mobile">
                        <ul className="grid grid-cols-2 border-t border-l border-line">
                          {links.map((link) => {
                            const Icon = ICONS[link.href] ?? FolderKanban;
                            const active = pathname === link.href;
                            return (
                              <li key={link.href} className="border-r border-b border-line">
                                <Link
                                  href={link.href}
                                  onClick={close}
                                  aria-current={active ? "page" : undefined}
                                  className={cn(
                                    "hover-corners flex min-h-16 items-center gap-3 px-4 py-4 text-sm font-medium transition-colors duration-200 focus-visible:outline-offset-[-3px]",
                                    active
                                      ? "bg-surface-2 text-green"
                                      : "text-text hover:bg-surface-2",
                                  )}
                                >
                                  <Icon
                                    className="size-4.5 shrink-0 text-muted"
                                    aria-hidden="true"
                                  />
                                  {link.label}
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      </nav>

                      <div className="mt-8">
                        <SplitButton href={cta.href} onClick={close} size="lg">
                          {cta.label}
                        </SplitButton>
                      </div>
                    </div>

                    <div className="shrink-0 border-t border-line px-5 py-6">
                      <Eyebrow tone="green" className="mb-4">
                        Social media
                      </Eyebrow>
                      <ul className="flex gap-3">
                        {socials.map(({ label, href, Icon }) => (
                          <li key={label}>
                            <a
                              href={href}
                              target={href.startsWith("http") ? "_blank" : undefined}
                              rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
                              aria-label={label}
                              className="flex size-11 items-center justify-center border border-line-strong text-text transition-colors duration-200 hover:border-green hover:text-green"
                            >
                              <Icon className="size-4.5" />
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </motion.div>
                </div>
              ) : null}
            </AnimatePresence>,
            document.body,
          )
        : null}
    </>
  );
}
