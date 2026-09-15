/**
 * The site's motion tokens for Framer Motion, mirroring `--ease-*` in globals.css. One language
 * everywhere: things that move glide out and settle (no snap), colour and opacity ease in and
 * out evenly, and panels that change size ease both ends. Durations sit a little long on
 * purpose, so nothing on the site reads as an instant swap.
 */

/** Movement: fast enough to feel direct, with a long soft landing (ease-out quint). */
export const EASE_GLIDE = [0.22, 1, 0.36, 1] as const;
/** Colour and opacity: an even fade with a gentle start. */
export const EASE_SMOOTH = [0.33, 0, 0.2, 1] as const;
/** Size changes and panels that open and close: eased at both ends. */
export const EASE_IN_OUT = [0.65, 0, 0.35, 1] as const;

/** Seconds, for Framer. CSS uses the same numbers in ms. */
export const DURATION = {
  /** Hover colour. */
  fast: 0.3,
  /** Filtering a list, opening an accordion. */
  base: 0.55,
  /** Drawers and side panels. */
  panel: 0.6,
  /** Scroll reveals. */
  reveal: 1.1,
} as const;
