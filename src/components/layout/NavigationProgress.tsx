"use client";

import { usePathname } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";

type State = "idle" | "pending" | "done";

/**
 * One store for the whole site: which state the navigation line is in. Kept outside React so
 * the document-level click listener and the route-change effect can both drive it without a
 * setState-in-effect.
 */
const store = {
  state: "idle" as State,
  listeners: new Set<() => void>(),
  timer: 0,
  set(next: State) {
    if (this.state === next) return;
    this.state = next;
    this.listeners.forEach((l) => l());
  },
  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  },
  getSnapshot() {
    return this.state;
  },
  getServerSnapshot(): State {
    return "idle";
  },
  /** The route is on its way: show the line (after its own 180ms grace in CSS). */
  start() {
    window.clearTimeout(this.timer);
    this.set("pending");
    // a navigation that never lands (a blocked link, a full reload) must not leave the line up
    this.timer = window.setTimeout(() => this.set("idle"), 12_000);
  },
  /** The new page has arrived: run the line out, then rest. */
  finish() {
    window.clearTimeout(this.timer);
    if (this.state !== "pending") return;
    this.set("done");
    this.timer = window.setTimeout(() => this.set("idle"), DONE_MS);
  },
};

/** How long the "done" run-out shows: the length of `nav-progress-finish` in globals.css, plus a beat. */
const DONE_MS = 700;

/**
 * Whether a click on this anchor is one the app router will turn into a page navigation:
 * same origin, a different page, no new tab or download, no modifier key.
 */
function isPageNavigation(anchor: HTMLAnchorElement, event: MouseEvent) {
  if (event.defaultPrevented || event.button !== 0) return false;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false;
  if (anchor.target && anchor.target !== "_self") return false;
  if (anchor.hasAttribute("download")) return false;
  const url = new URL(anchor.href, location.href);
  if (url.origin !== location.origin) return false;
  // in-page anchors and links to the page already showing (the current nav link, a ?query)
  if (url.pathname === location.pathname) return false;
  return true;
}

/**
 * The navigation line: a green hairline along the top edge that grows while a page is still on
 * its way and completes as it arrives (`.nav-progress` in globals.css). It listens for clicks on
 * internal links at the document, so every link on the site counts (the header, the drawer, the
 * footer, every card and button), and ends when the pathname changes. It only ever shows when a
 * navigation takes longer than a beat, so an instant, prefetched navigation never flashes it;
 * it is what keeps a slow one from reading as a dead click. Decoration only.
 */
export function NavigationProgress() {
  const state = useSyncExternalStore(
    (l) => store.subscribe(l),
    () => store.getSnapshot(),
    () => store.getServerSnapshot(),
  );
  const pathname = usePathname();

  useEffect(() => {
    function onClick(event: MouseEvent) {
      const anchor = (event.target as Element | null)?.closest?.("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (!isPageNavigation(anchor, event)) return;
      // Next's Link prevents the default itself and then navigates, so the event's state after
      // the handlers says nothing; a navigation that never lands is covered by the store's cap.
      store.start();
    }
    // capture, so a handler that stops propagation cannot hide the click
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  // The route changed: the page is here.
  useEffect(() => {
    store.finish();
  }, [pathname]);

  return <div aria-hidden="true" className="nav-progress" data-state={state} />;
}
