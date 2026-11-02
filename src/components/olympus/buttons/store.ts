import { useSyncExternalStore } from "react";

/**
 * The OlympusButton settings this browser shows (the "g" menu, ButtonMenu): the look and the
 * hover. Tiny external stores over localStorage: the server and the hydration render see the
 * defaults, a saved choice appears right after, and other tabs follow through `storage`.
 */

export const BUTTON_STYLES = [
  {
    id: "key",
    label: "Meander keys",
    note: "A Greek key at each end of a framed cell.",
  },
  {
    id: "columns",
    label: "Columns",
    note: "A pixel column at each end, lintel above and step below.",
  },
  { id: "pediment", label: "Temple front", note: "A pixel gable on a framed cell." },
  { id: "laurel", label: "Laurel", note: "Two sprigs of laurel, no frame." },
  { id: "stele", label: "Stele", note: "A stone tablet ruled twice top and bottom." },
  { id: "band", label: "Key band", note: "A running Greek key along the top and bottom edges." },
  { id: "dentils", label: "Dentils", note: "A cornice of square teeth over the cell." },
  {
    id: "interpunct",
    label: "Inscription",
    note: "Words parted by interpuncts, carved on a rule.",
  },
  { id: "alphaomega", label: "Alpha and omega", note: "Pixel Α and Ω at either end." },
  { id: "wave", label: "Running wave", note: "The Vitruvian scroll under the words." },
] as const;

export const BUTTON_HOVERS = [
  { id: "lit", label: "Torchlight", note: "The ornaments and the frame glow green." },
  { id: "flicker", label: "Flicker", note: "The ornaments flicker like a torch, in steps." },
  { id: "underline", label: "Underline", note: "A green rule draws out from the centre below." },
  { id: "corners", label: "Brackets", note: "Pixel brackets close in on the four corners." },
  { id: "double", label: "Double rule", note: "A second green rule appears around the frame." },
  { id: "wash", label: "Wash", note: "A faint green wash comes up behind the words." },
] as const;

export type ButtonStyleId = (typeof BUTTON_STYLES)[number]["id"];
export type ButtonHoverId = (typeof BUTTON_HOVERS)[number]["id"];
export const DEFAULT_BUTTON_STYLE: ButtonStyleId = "key";
export const DEFAULT_BUTTON_HOVER: ButtonHoverId = "double";

function setting<T extends string>(key: string, ids: readonly { id: T }[], fallback: T) {
  const listeners = new Set<() => void>();
  let memory: T | null = null;
  const isId = (v: unknown): v is T => ids.some((o) => o.id === v);

  function get(): T {
    if (memory) return memory;
    try {
      const saved = window.localStorage.getItem(key);
      return isId(saved) ? saved : fallback;
    } catch {
      return fallback;
    }
  }
  function subscribe(listener: () => void) {
    listeners.add(listener);
    const onStorage = (e: StorageEvent) => {
      if (e.key === null || e.key === key) listener();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(listener);
      window.removeEventListener("storage", onStorage);
    };
  }
  function set(id: T) {
    try {
      if (id === fallback) window.localStorage.removeItem(key);
      else window.localStorage.setItem(key, id);
      memory = null;
    } catch {
      memory = id;
    }
    listeners.forEach((fn) => fn());
  }
  const useSetting = () => useSyncExternalStore(subscribe, get, () => fallback);
  return { set, useSetting };
}

const style = setting("htf:olympus-button", BUTTON_STYLES, DEFAULT_BUTTON_STYLE);
const hover = setting("htf:olympus-button-hover", BUTTON_HOVERS, DEFAULT_BUTTON_HOVER);

export const setButtonStyle = style.set;
export const useButtonStyle = style.useSetting;
export const setButtonHover = hover.set;
export const useButtonHover = hover.useSetting;
