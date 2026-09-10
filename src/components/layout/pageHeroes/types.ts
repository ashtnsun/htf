import type { ReactNode } from "react";

/**
 * What the inner pages hand every page-hero variant (layout/PageHero picks one). Every
 * variant renders the same content: the eyebrow, one `h1` (`#page-title`) built from `lines`
 * (*asterisks* mark the green words), the blurb and whatever actions the page passes.
 */
export type PageHeroProps = {
  eyebrow: string;
  /** One string per line; *asterisks* mark green words. */
  lines: string[];
  blurb?: string;
  children?: ReactNode;
  /** Use the staggered left/right composition (the variants that have one). */
  stagger?: boolean;
};
