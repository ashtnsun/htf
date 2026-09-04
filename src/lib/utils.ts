import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind class names, resolving conflicts (last wins). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Content fields the design director still has to fill are marked with a leading "TODO". */
export function isTodo(value: string | undefined | null): boolean {
  return !value || /^\[?TODO/i.test(value.trim());
}
