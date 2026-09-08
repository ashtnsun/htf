import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * tailwind-merge cannot tell the site's type scale (`text-display-fluid`, `text-h2`, …, the
 * `--text-*` tokens in globals.css) from a text colour, so without this a later `text-muted`
 * would silently drop the size. Registering them as font sizes keeps both.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        {
          text: [
            "display-xl",
            "display-lg",
            "display",
            "display-fluid",
            "h2",
            "h3",
            "body",
            "body-lg",
            "eyebrow",
          ],
        },
      ],
    },
  },
});

/** Merge Tailwind class names, resolving conflicts (last wins). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Content fields the design director still has to fill are marked with a leading "TODO". */
export function isTodo(value: string | undefined | null): boolean {
  return !value || /^\[?TODO/i.test(value.trim());
}
