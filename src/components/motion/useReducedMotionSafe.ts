"use client";

import { useReducedMotion } from "framer-motion";
import { useSyncExternalStore } from "react";

const subscribeNoop = () => () => {};

/**
 * `useReducedMotion` that is false until hydration. Framer's hook already knows the media
 * query on the client's first render, but the server rendered the animated markup (hidden
 * initial styles included); switching to static elements in that same render is a hydration
 * mismatch React never patches, so the hidden styles stick and the content stays invisible.
 * Reporting false first and true right after hydration turns the swap into a normal update.
 */
export function useReducedMotionSafe(): boolean {
  const hydrated = useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );
  const reduce = useReducedMotion();
  return hydrated && Boolean(reduce);
}
